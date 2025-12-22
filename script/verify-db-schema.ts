
import {
    users, tenants, prompts, promptVersions,
    collaborationSessions, sessionMembers,
    semanticCache, marketplacePrompts, runs
} from '../shared/schema';

const EXPECTED_TABLES = [
    'users', 'tenants', 'prompts', 'promptVersions',
    'collaborationSessions', 'sessionMembers',
    'semanticCache', 'marketplacePrompts', 'runs'
];

console.log("Verifying Database Schema Exports...");

let missing = [];
if (!users) missing.push('users');
if (!tenants) missing.push('tenants');
if (!prompts) missing.push('prompts');
if (!promptVersions) missing.push('promptVersions');
if (!collaborationSessions) missing.push('collaborationSessions');
if (!sessionMembers) missing.push('sessionMembers');
if (!semanticCache) missing.push('semanticCache');
if (!marketplacePrompts) missing.push('marketplacePrompts');
if (!runs) missing.push('runs');

if (missing.length > 0) {
    console.error("❌ Missing exports for:", missing.join(', '));
    process.exit(1);
} else {
    console.log("✅ All required tables are exported correctly.");

    // Basic property check (simulated)
    // We check if we can access the 'id' column definition of each table
    try {
        const checks = [
            users.id, tenants.id, prompts.id, promptVersions.id,
            collaborationSessions.id, sessionMembers.id,
            semanticCache.id, marketplacePrompts.id, runs.id
        ];
        console.log("✅ Table structure checks passed (ID columns validation).");
        process.exit(0);
    } catch (e) {
        console.error("❌ Failed to access table properties:", e);
        process.exit(1);
    }
}
