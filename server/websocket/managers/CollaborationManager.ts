import { db } from '../../storage';
import { redis } from '../../lib/redis';
import {
    collaborationSessions, sessionMembers, editHistory,
    type CollaborationSession, type User
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export type MemberRole = 'OWNER' | 'EDITOR' | 'VIEWER';

interface SessionState {
    sessionId: string;
    content: string;
    version: number;
    lastModified: number;
    activeUsers: Set<string>;
}

export class CollaborationManager {
    private sessions: Map<string, SessionState> = new Map();
    private readonly SESSION_LOCK_TTL = 30; // seconds

    async getSession(sessionId: string): Promise<CollaborationSession & { owner: User, members: any[] } | null> {
        try {
            const session = await db.query.collaborationSessions.findFirst({
                where: eq(collaborationSessions.id, sessionId),
                with: {
                    owner: true,
                    members: {
                        with: {
                            user: true,
                        },
                    },
                },
            });

            if (!session) return null;

            // Type assertion or transformation might be needed depending on detailed schema usage
            return session as any;
        } catch (error) {
            console.error('Error fetching session:', error);
            return null;
        }
    }

    async getSessionByShareToken(shareToken: string): Promise<CollaborationSession | null> {
        try {
            const session = await db.query.collaborationSessions.findFirst({
                where: eq(collaborationSessions.shareToken, shareToken),
            });

            if (!session) return null;

            return this.getSession(session.id);
        } catch (error) {
            console.error('Error fetching session by share token:', error);
            return null;
        }
    }

    async joinSession(sessionId: string, userId: string, role: MemberRole = 'VIEWER'): Promise<boolean> {
        try {
            // Check if already a member
            const existingMember = await db.query.sessionMembers.findFirst({
                where: and(
                    eq(sessionMembers.userId, userId),
                    eq(sessionMembers.sessionId, sessionId)
                ),
            });

            if (existingMember) {
                // Update last seen
                await db.update(sessionMembers)
                    .set({ lastSeenAt: new Date() })
                    .where(eq(sessionMembers.id, existingMember.id));
                return true;
            }

            // Add as new member
            // Note: UUID generation should ideally happen in DB or passed in. 
            // Since we don't have crypto.randomUUID available easily without node types enabled sometimes,
            // we assume the caller or default handles ID if serial, but here it is TEXT primary key.
            // We will use a simple random string for now or rely on default if configured.
            // Assuming 'createInsertSchema' or defaults handle it? No, schema says primaryKey text.
            // We need to generate ID.
            const memberId = crypto.randomUUID();

            await db.insert(sessionMembers).values({
                id: memberId,
                userId,
                sessionId,
                role,
            });

            // Initialize session state if not exists
            if (!this.sessions.has(sessionId)) {
                const session = await db.query.collaborationSessions.findFirst({
                    where: eq(collaborationSessions.id, sessionId)
                });
                if (session) {
                    this.sessions.set(sessionId, {
                        sessionId,
                        content: session.content || '',
                        version: 0,
                        lastModified: Date.now(),
                        activeUsers: new Set(),
                    });
                }
            }

            const state = this.sessions.get(sessionId);
            if (state) {
                state.activeUsers.add(userId);
            }

            return true;
        } catch (error) {
            console.error('Error joining session:', error);
            return false;
        }
    }

    async leaveSession(sessionId: string, userId: string): Promise<void> {
        const state = this.sessions.get(sessionId);
        if (state) {
            state.activeUsers.delete(userId);

            // Clean up if no active users
            if (state.activeUsers.size === 0) {
                // Persist content before cleanup
                await this.persistContent(sessionId);
            }
        }

        // Update last seen
        // In Drizzle, updateWhere needs specific handling.
        // We first find the member ID.
        const member = await db.query.sessionMembers.findFirst({
            where: and(
                eq(sessionMembers.userId, userId),
                eq(sessionMembers.sessionId, sessionId)
            )
        });

        if (member) {
            await db.update(sessionMembers)
                .set({ lastSeenAt: new Date() })
                .where(eq(sessionMembers.id, member.id));
        }
    }

    async getUserRole(sessionId: string, userId: string): Promise<MemberRole | null> {
        try {
            // Check if owner
            const session = await db.query.collaborationSessions.findFirst({
                where: eq(collaborationSessions.id, sessionId),
                columns: { ownerId: true }
            });

            if (session?.ownerId === userId) {
                return 'OWNER';
            }

            // Check membership
            const member = await db.query.sessionMembers.findFirst({
                where: and(
                    eq(sessionMembers.userId, userId),
                    eq(sessionMembers.sessionId, sessionId)
                )
            });

            return (member?.role as MemberRole) || null;
        } catch (error) {
            console.error('Error getting user role:', error);
            return null;
        }
    }

    async updateContent(sessionId: string, content: string, userId: string): Promise<boolean> {
        try {
            // Acquire lock
            const lockKey = `session:lock:${sessionId}`;
            const lockAcquired = await redis.set(lockKey, userId, 'EX', this.SESSION_LOCK_TTL, 'NX');

            if (!lockAcquired) {
                // Check if we own the lock
                const lockOwner = await redis.get(lockKey);
                if (lockOwner !== userId) {
                    return false;
                }
            }

            try {
                const state = this.sessions.get(sessionId);
                const previousContent = state?.content || '';

                // Update in-memory state
                if (state) {
                    state.content = content;
                    state.version++;
                    state.lastModified = Date.now();
                }

                // Store in Redis for quick access
                await redis.set(`session:content:${sessionId}`, content, 'EX', 3600);

                // Record edit history
                await db.insert(editHistory).values({
                    sessionId,
                    userId,
                    operation: JSON.stringify({ type: 'update', timestamp: Date.now() }),
                    contentBefore: previousContent.slice(0, 10000),
                    contentAfter: content.slice(0, 10000),
                });

                return true;
            } finally {
                // Release lock
                await redis.del(lockKey);
            }
        } catch (error) {
            console.error('Error updating content:', error);
            return false;
        }
    }

    async persistContent(sessionId: string): Promise<void> {
        const state = this.sessions.get(sessionId);
        if (!state) return;

        try {
            await db.update(collaborationSessions)
                .set({ content: state.content })
                .where(eq(collaborationSessions.id, sessionId));
        } catch (error) {
            console.error('Error persisting content:', error);
        }
    }

    getSessionState(sessionId: string): SessionState | undefined {
        return this.sessions.get(sessionId);
    }

    getActiveUsers(sessionId: string): string[] {
        const state = this.sessions.get(sessionId);
        return state ? Array.from(state.activeUsers) : [];
    }
}
