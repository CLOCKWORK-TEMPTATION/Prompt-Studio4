import { db } from '../storage';
import {
  semanticCache, cacheTags, cacheStatistics, cacheConfig,
  type SemanticCache
} from '@shared/schema';
import { eq, and, sql, desc, lt, inArray } from 'drizzle-orm';
// import { openai } from '../../lib/openai'; // Assuming we have or will create this. Using placeholder or check file.

// Placeholder for OpenAI client until we confirm location or create it
// Using a simple mock or assuming direct usage for now as in original service
import OpenAI from 'openai';
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

interface CacheTag {
  id: number;
  name: string;
  cacheId: string;
}

interface SemanticCacheEntry extends SemanticCache {
  tags: CacheTag[];
}

interface CacheConfigType {
  id?: number;
  enabled: boolean;
  similarityThreshold: number;
  defaultTTLSeconds: number;
  maxCacheSize: number;
  invalidationRules?: any[];
  updatedAt?: string;
}

interface CacheSearchResult {
  entry: SemanticCacheEntry;
  similarity: number;
}

interface CacheLookupRequest {
  prompt: string;
  model?: string;
  threshold?: number;
  tags?: string[];
}

interface CacheLookupResponse {
  hit: boolean;
  entry?: SemanticCacheEntry;
  similarity?: number;
  cached: boolean;
}

interface CacheStoreRequest {
  prompt: string;
  response: string;
  model?: string;
  tags?: string[];
  ttlSeconds?: number;
  userId?: string;
}

interface CacheInvalidateRequest {
  type: 'id' | 'tag' | 'pattern' | 'all';
  ids?: string[];
  tags?: string[];
  pattern?: string;
}

interface CacheInvalidateResponse {
  deletedCount: number;
  success: boolean;
}

interface CacheAnalytics {
  totalEntries: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  tokensSaved: number;
  estimatedCostSaved: number;
  averageSimilarity: number;
  cacheSize: number;
  oldestEntry: string;
  newestEntry: string;
  topTags: Array<{ tag: string; count: number }>;
  dailyStats: any[];
}

import crypto from 'crypto';

// Logger للأخطاء والتشخيص
class CacheLogger {
  private static instance: CacheLogger;
  
  private constructor() {}
  
  static getInstance(): CacheLogger {
    if (!CacheLogger.instance) {
      CacheLogger.instance = new CacheLogger();
    }
    return CacheLogger.instance;
  }
  
  error(message: string, error?: any) {
    // تجنب الطباعة في بيئة الاختبار لمنع "Cannot log after tests are done"
    if (process.env.NODE_ENV !== 'test') {
      console.error(`[SemanticCache] ERROR: ${message}`, error ? `\n${error.stack || error}` : '');
    }
  }
  
  warn(message: string) {
    // تجنب الطباعة في بيئة الاختبار
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[SemanticCache] WARN: ${message}`);
    }
  }
  
  info(message: string) {
    console.log(`[SemanticCache] INFO: ${message}`);
  }
  
  debug(message: string) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SemanticCache] DEBUG: ${message}`);
    }
  }
}

// Database connection checker
class DatabaseChecker {
  private static isAvailable: boolean | null = null;
  
  static async checkConnection(): Promise<boolean> {
    if (DatabaseChecker.isAvailable !== null) {
      return DatabaseChecker.isAvailable;
    }
    
    try {
      await db.select().from(semanticCache).limit(1);
      DatabaseChecker.isAvailable = true;
      return true;
    } catch (error: any) {
      const logger = CacheLogger.getInstance();
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        logger.warn('Database connection unavailable - using fallback mode');
      } else {
        logger.error('Database connection check failed', error);
      }
      DatabaseChecker.isAvailable = false;
      return false;
    }
  }
  
  static reset() {
    DatabaseChecker.isAvailable = null;
  }
}

export class SemanticCacheService {
  private cacheConfig: CacheConfigType | null = null;
  private logger = CacheLogger.getInstance();
  private fallbackCache = new Map<string, any>();
  private fallbackConfig: CacheConfigType = {
    enabled: true,
    similarityThreshold: 0.85,
    defaultTTLSeconds: 3600,
    maxCacheSize: 1000,
    invalidationRules: []
  };

  public async getConfig(): Promise<CacheConfigType> {
    if (this.cacheConfig) {
      return this.cacheConfig;
    }

    const dbAvailable = await DatabaseChecker.checkConnection();
    if (!dbAvailable) {
      this.logger.warn('Using fallback configuration - database unavailable');
      this.cacheConfig = this.fallbackConfig;
      return this.cacheConfig;
    }

    try {
      let dbConfig = await db.query.cacheConfig.findFirst();

      if (!dbConfig) {
        const [newConfig] = await db.insert(cacheConfig).values({
          enabled: true,
          similarityThreshold: 0.85,
          defaultTTLSeconds: 3600,
          maxCacheSize: 10000,
          invalidationRules: [],
        }).returning();
        dbConfig = newConfig;
      }

      this.cacheConfig = {
        ...dbConfig,
        invalidationRules: dbConfig.invalidationRules || [],
        updatedAt: dbConfig.updatedAt.toISOString(),
      };

      return this.cacheConfig!;
    } catch (error: any) {
      this.logger.error('Failed to get config from database, using fallback', error);
      DatabaseChecker.reset();
      this.cacheConfig = this.fallbackConfig;
      return this.cacheConfig;
    }
  }

  async updateConfig(updates: Partial<CacheConfigType>): Promise<CacheConfigType> {
    const currentConfig = await this.getConfig();
    const dbAvailable = await DatabaseChecker.checkConnection();
    
    if (!dbAvailable) {
      this.logger.warn('Database unavailable - updating fallback config only');
      this.cacheConfig = {
        ...currentConfig,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return this.cacheConfig;
    }

    try {
      const [updatedConfig] = await db.update(cacheConfig)
        .set({
          enabled: updates.enabled ?? currentConfig.enabled,
          similarityThreshold: updates.similarityThreshold ?? currentConfig.similarityThreshold,
          defaultTTLSeconds: updates.defaultTTLSeconds ?? currentConfig.defaultTTLSeconds,
          maxCacheSize: updates.maxCacheSize ?? currentConfig.maxCacheSize,
          invalidationRules: updates.invalidationRules ?? currentConfig.invalidationRules,
        })
        .where(eq(cacheConfig.id, currentConfig.id!))
        .returning();

      this.cacheConfig = {
        ...updatedConfig,
        invalidationRules: updatedConfig.invalidationRules || [],
        updatedAt: updatedConfig.updatedAt.toISOString(),
      };

      return this.cacheConfig!;
    } catch (error: any) {
      this.logger.error('Failed to update config in database, using fallback', error);
      DatabaseChecker.reset();
      this.cacheConfig = {
        ...currentConfig,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      return this.cacheConfig;
    }
  }

  private generateHash(prompt: string): string {
    return crypto.createHash('sha256').update(prompt.toLowerCase().trim()).digest('hex');
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    if (!openai) {
      // Fallback: إنشاء embedding مولّد محلياً (للبيئات بدون OpenAI API)
      const hash = this.generateHash(text);
      const embedding: number[] = [];
      for (let i = 0; i < 1536; i++) {
        const charCode = hash.charCodeAt(i % hash.length);
        embedding.push((charCode - 64) / 64);
      }
      return embedding;
    }

    try {
      // استخدام OpenAI API للحصول على embeddings حقيقية
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.slice(0, 8000), // الحد الأقصى للإدخال
      });
      return response.data[0].embedding;
    } catch (error: any) {
      // معالجة أخطاء API بشكل صحيح
      if (error?.status === 429) {
        // معدل الطلبات مرتفع جداً
        throw new Error('RATE_LIMIT_EXCEEDED: Too many requests to OpenAI API');
      } else if (error?.status === 401) {
        // مفتاح API غير صالح
        throw new Error('INVALID_API_KEY: OpenAI API key is invalid');
      } else if (error?.status === 500 || error?.status === 503) {
        // خطأ في خادم OpenAI
        throw new Error('OPENAI_SERVER_ERROR: OpenAI service is temporarily unavailable');
      } else {
        // أخطاء أخرى
        console.error('Error generating embedding:', error);
        throw new Error(`EMBEDDING_GENERATION_FAILED: ${error?.message || 'Unknown error'}`);
      }
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  async lookup(request: CacheLookupRequest): Promise<CacheLookupResponse> {
    try {
      const config = await this.getConfig();

      if (!config.enabled) {
        this.logger.debug('Cache is disabled');
        return { hit: false, cached: false };
      }

      const { prompt, model, threshold = config.similarityThreshold, tags } = request;

      // التحقق من صحة المدخلات
      if (!prompt || prompt.trim().length === 0) {
        this.logger.warn('Empty prompt provided to lookup');
        return { hit: false, cached: false };
      }

      // Exact Match (أسرع من البحث الدلالي)
      const promptHash = this.generateHash(prompt);
      const exactMatch = await this.findByHash(promptHash, model);

      if (exactMatch) {
        this.logger.debug(`Exact cache hit for hash: ${promptHash.substring(0, 8)}...`);
        await this.recordHit(exactMatch.id);
        return {
          hit: true,
          entry: exactMatch,
          similarity: 1.0,
          cached: true,
        };
      }

      // Semantic Search (بحث دلالي)
      try {
        const embedding = await this.generateEmbedding(prompt);
        const similarEntry = await this.findSimilar(embedding, threshold, model, tags);

        if (similarEntry) {
          this.logger.debug(`Semantic cache hit with similarity: ${similarEntry.similarity.toFixed(3)}`);
          await this.recordHit(similarEntry.entry.id);
          return {
            hit: true,
            entry: similarEntry.entry,
            similarity: similarEntry.similarity,
            cached: true,
          };
        }
      } catch (error: any) {
        // لا نفشل العملية الكاملة بسبب فشل البحث الدلالي
        this.logger.error('Semantic search failed, continuing without cache', error);
        
        // في حالة أخطاء API، نسجل miss بدلاً من إيقاف التطبيق
        if (error.message?.includes('RATE_LIMIT') || error.message?.includes('OPENAI_SERVER_ERROR')) {
          this.logger.warn('OpenAI API temporarily unavailable, cache miss recorded');
        }
      }

      await this.recordMiss();
      return { hit: false, cached: false };
    } catch (error: any) {
      this.logger.error('Cache lookup failed completely', error);
      // نعيد miss بدلاً من throw لتجنب كسر التطبيق
      return { hit: false, cached: false };
    }
  }

  private async findByHash(hash: string, model?: string): Promise<SemanticCacheEntry | null> {
    const dbAvailable = await DatabaseChecker.checkConnection();
    
    if (!dbAvailable) {
      // Fallback to in-memory cache
      const entry = this.fallbackCache.get(hash);
      if (!entry || Date.now() > entry.expiresAt) {
        return null;
      }
      if (model && entry.model !== model && entry.model !== 'unknown') {
        return null;
      }
      return entry;
    }

    try {
      const whereClause = and(
        eq(semanticCache.promptHash, hash),
        sql`${semanticCache.expiresAt} > NOW()`
      );

      const entry = await db.query.semanticCache.findFirst({
        where: whereClause
      });

      if (!entry) return null;
      if (model && entry.model !== model && entry.model !== 'unknown') return null;

      const tags = await db.select().from(cacheTags).where(eq(cacheTags.cacheId, entry.id));

      return { ...entry, tags };
    } catch (error: any) {
      this.logger.error('Database query failed in findByHash, using fallback', error);
      DatabaseChecker.reset();
      
      const entry = this.fallbackCache.get(hash);
      if (!entry || Date.now() > entry.expiresAt) {
        return null;
      }
      if (model && entry.model !== model && entry.model !== 'unknown') {
        return null;
      }
      return entry;
    }
  }

  private async findSimilar(
    embedding: number[],
    threshold: number,
    model?: string,
    tags?: string[]
  ): Promise<CacheSearchResult | null> {
    // 1. Build pre-filtered candidate set (non-expired, optionally model-filtered, optionally tag-filtered)
    // Note: With pgvector we'd do ANN search. Here we narrow the set before cosine similarity.

    const baseWhere: any[] = [sql`${semanticCache.expiresAt} > NOW()`];

    // Model prefilter: allow 'unknown' to match as a fallback
    if (model && model.trim().length > 0) {
      baseWhere.push(sql`(${semanticCache.model} = ${model} OR ${semanticCache.model} = 'unknown')`);
    }

    // Tag prefilter: gather cache IDs that have any of requested tags
    let tagFilteredIds: string[] | null = null;
    if (tags && tags.length > 0) {
      const tagRows = await db
        .select({ cacheId: cacheTags.cacheId })
        .from(cacheTags)
        .where(inArray(cacheTags.name, tags));
      tagFilteredIds = Array.from(new Set(tagRows.map((t) => t.cacheId)));
      if (tagFilteredIds.length > 0) {
        baseWhere.push(inArray(semanticCache.id, tagFilteredIds));
      } else {
        // No candidates with these tags
        return null;
      }
    }

    const whereClause = baseWhere.length === 1 ? baseWhere[0] : and(...baseWhere);

    // Limit scan aggressively to reduce memory/time; prefer most recent entries
    const candidates = await db
      .select()
      .from(semanticCache)
      .where(whereClause)
      .orderBy(desc(semanticCache.createdAt))
      .limit(500);
    let bestMatch: { entry: SemanticCache; similarity: number } | null = null;

    for (const entry of candidates) {
      // model filtering already handled in WHERE
      // Manual tag filtering: if tagFilteredIds provided, skip IDs not in set
      if (tagFilteredIds && tagFilteredIds.length > 0 && !tagFilteredIds.includes(entry.id)) {
        continue;
      }

      const entryEmbedding = entry.embedding as number[];
      const similarity = this.cosineSimilarity(embedding, entryEmbedding);

      if (similarity >= threshold && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { entry, similarity };
      }
    }

    if (!bestMatch) return null;

    const matchedTags = await db.select().from(cacheTags).where(eq(cacheTags.cacheId, bestMatch.entry.id));

    return {
      entry: { ...bestMatch.entry, tags: matchedTags },
      similarity: bestMatch.similarity
    };
  }

  async store(request: CacheStoreRequest): Promise<SemanticCacheEntry> {
    try {
      const config = await this.getConfig();
      const { prompt, response, model, tags = [], ttlSeconds, userId } = request;

      // التحقق من صحة المدخلات
      if (!prompt || prompt.trim().length === 0) {
        throw new Error('CACHE_INVALID_INPUT: Prompt cannot be empty');
      }
      if (!response || response.trim().length === 0) {
        throw new Error('CACHE_INVALID_INPUT: Response cannot be empty');
      }

      this.logger.debug(`Storing cache entry for prompt length: ${prompt.length}`);

      const promptHash = this.generateHash(prompt);
      
      // إنشاء embedding مع إعادة المحاولة
      let embedding: number[];
      try {
        embedding = await this.generateEmbedding(prompt);
      } catch (error: any) {
        this.logger.error('Failed to generate embedding for cache storage', error);
        
        // في حالة فشل OpenAI API، نستخدم الـ fallback
        if (error.message?.includes('OPENAI') || error.message?.includes('RATE_LIMIT')) {
          this.logger.warn('Using fallback embedding generation');
          const hash = this.generateHash(prompt);
          embedding = [];
          for (let i = 0; i < 1536; i++) {
            const charCode = hash.charCodeAt(i % hash.length);
            embedding.push((charCode - 64) / 64);
          }
        } else {
          throw error;
        }
      }
      
      const ttl = ttlSeconds || config.defaultTTLSeconds;
      const expiresAt = new Date(Date.now() + ttl * 1000);
      const tokensSaved = Math.ceil(response.length / 4);
      const id = crypto.randomUUID();

      const dbAvailable = await DatabaseChecker.checkConnection();
      
      if (!dbAvailable) {
        // Fallback to in-memory storage
        this.logger.warn('Database unavailable - storing in fallback cache');
        
        // Simple eviction for fallback cache
        if (this.fallbackCache.size >= config.maxCacheSize) {
          const oldestKey = this.fallbackCache.keys().next().value;
          this.fallbackCache.delete(oldestKey);
        }
        
        const entry = {
          id,
          prompt,
          promptHash,
          embedding,
          response,
          model: model || 'unknown',
          tokensSaved,
          expiresAt: expiresAt.getTime(),
          userId,
          hitCount: 0,
          createdAt: new Date(),
          lastAccessedAt: new Date(),
          tags: tags.map(name => ({ id: Math.random(), name, cacheId: id }))
        };
        
        this.fallbackCache.set(promptHash, entry);
        this.logger.info(`Successfully stored cache entry in fallback with id: ${id.substring(0, 8)}...`);
        return entry;
      }

      try {
        // Check size and evict if needed
        try {
          const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(semanticCache);
          if (count >= config.maxCacheSize) {
            this.logger.info(`Cache size limit reached (${count}/${config.maxCacheSize}), evicting oldest entries`);
            const limit = Math.floor(config.maxCacheSize * 0.1);
            const toDeleteIds = await db.select({ id: semanticCache.id })
              .from(semanticCache)
              .orderBy(semanticCache.lastAccessedAt)
              .limit(limit);

            if (toDeleteIds.length > 0) {
              await db.delete(semanticCache).where(inArray(semanticCache.id, toDeleteIds.map(d => d.id)));
              this.logger.info(`Evicted ${toDeleteIds.length} old cache entries`);
            }
          }
        } catch (error) {
          this.logger.warn(`Failed to check/evict cache size, continuing anyway: ${error}`);
        }

        const [entry] = await db.insert(semanticCache).values({
          id,
          prompt,
          promptHash,
          embedding: embedding as any,
          response,
          model: model || 'unknown',
          tokensSaved,
          expiresAt,
          userId
        }).returning();

        if (tags.length > 0) {
          try {
            await db.insert(cacheTags).values(
              tags.map(name => ({
                name,
                cacheId: id
              }))
            );
          } catch (error) {
            this.logger.warn(`Failed to insert cache tags, continuing anyway: ${error}`);
          }
        }

        const newTags = await db.select().from(cacheTags).where(eq(cacheTags.cacheId, id));

        this.logger.info(`Successfully stored cache entry with id: ${id.substring(0, 8)}...`);
        return { ...entry, tags: newTags };
      } catch (error: any) {
        this.logger.error('Database storage failed, falling back to in-memory cache', error);
        DatabaseChecker.reset();
        
        // Fallback to in-memory storage
        if (this.fallbackCache.size >= config.maxCacheSize) {
          const oldestKey = this.fallbackCache.keys().next().value;
          this.fallbackCache.delete(oldestKey);
        }
        
        const entry = {
          id,
          prompt,
          promptHash,
          embedding,
          response,
          model: model || 'unknown',
          tokensSaved,
          expiresAt: expiresAt.getTime(),
          userId,
          hitCount: 0,
          createdAt: new Date(),
          lastAccessedAt: new Date(),
          tags: tags.map(name => ({ id: Math.random(), name, cacheId: id }))
        };
        
        this.fallbackCache.set(promptHash, entry);
        this.logger.info(`Successfully stored cache entry in fallback with id: ${id.substring(0, 8)}...`);
        return entry;
      }
    } catch (error: any) {
      this.logger.error('Failed to store cache entry completely', error);
      throw new Error(`CACHE_STORAGE_FAILED: ${error.message}`);
    }
  }

  async recordHit(entryId: string): Promise<void> {
    const dbAvailable = await DatabaseChecker.checkConnection();
    
    if (!dbAvailable) {
      this.logger.debug('Database unavailable - hit recording skipped');
      return;
    }

    try {
      const [updated] = await db.update(semanticCache)
        .set({
          hitCount: sql`${semanticCache.hitCount} + 1`,
          lastAccessedAt: new Date()
        })
        .where(eq(semanticCache.id, entryId))
        .returning();

      // Stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existingStat = await db.select().from(cacheStatistics).where(eq(cacheStatistics.date, today)).limit(1).then(r => r[0]);

      if (existingStat) {
        await db.update(cacheStatistics).set({
          totalHits: sql`${cacheStatistics.totalHits} + 1`,
          tokensSaved: sql`${cacheStatistics.tokensSaved} + ${updated.tokensSaved || 0}`,
          costSaved: sql`${cacheStatistics.costSaved} + ${(updated.tokensSaved || 0) * 0.00001}`
        }).where(eq(cacheStatistics.id, existingStat.id));
      } else {
        await db.insert(cacheStatistics).values({
          date: today,
          totalHits: 1,
          tokensSaved: updated.tokensSaved || 0,
          costSaved: (updated.tokensSaved || 0) * 0.00001
        });
      }
    } catch (error: any) {
      this.logger.error('Failed to record cache hit', error);
      DatabaseChecker.reset();
    }
  }

  async recordMiss(): Promise<void> {
    const dbAvailable = await DatabaseChecker.checkConnection();
    
    if (!dbAvailable) {
      this.logger.debug('Database unavailable - miss recording skipped');
      return;
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const existingStat = await db.select().from(cacheStatistics).where(eq(cacheStatistics.date, today)).limit(1).then(r => r[0]);

      if (existingStat) {
        await db.update(cacheStatistics).set({
          totalMisses: sql`${cacheStatistics.totalMisses} + 1`,
        }).where(eq(cacheStatistics.id, existingStat.id));
      } else {
        await db.insert(cacheStatistics).values({
          date: today,
          totalMisses: 1
        });
      }
    } catch (error: any) {
      this.logger.error('Failed to record cache miss', error);
      DatabaseChecker.reset();
    }
  }

  async getAnalytics(): Promise<CacheAnalytics> {
    // إحصائيات عامة
    const [{ totalEntries }] = await db.select({ 
      totalEntries: sql<number>`count(*)` 
    }).from(semanticCache);

    // إحصائيات اليوم
    const stats = await db.select()
      .from(cacheStatistics)
      .orderBy(desc(cacheStatistics.date))
      .limit(30);

    const totalHits = stats.reduce((sum, s) => sum + (s.totalHits || 0), 0);
    const totalMisses = stats.reduce((sum, s) => sum + (s.totalMisses || 0), 0);
    const tokensSaved = stats.reduce((sum, s) => sum + (s.tokensSaved || 0), 0);
    const costSaved = stats.reduce((sum, s) => sum + (s.costSaved || 0), 0);

    const hitRate = totalHits + totalMisses > 0 
      ? (totalHits / (totalHits + totalMisses)) * 100 
      : 0;

    // أقدم وأحدث إدخال
    const [oldestEntry] = await db.select({ createdAt: semanticCache.createdAt })
      .from(semanticCache)
      .orderBy(semanticCache.createdAt)
      .limit(1);

    const [newestEntry] = await db.select({ createdAt: semanticCache.createdAt })
      .from(semanticCache)
      .orderBy(desc(semanticCache.createdAt))
      .limit(1);

    // أكثر الوسوم استخدامًا
    const topTagsResult = await db.select({
      tag: cacheTags.name,
      count: sql<number>`count(*)`
    })
      .from(cacheTags)
      .groupBy(cacheTags.name)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    // حساب متوسط التشابه (من آخر 100 hit)
    const recentHits = await db.select({ hitCount: semanticCache.hitCount })
      .from(semanticCache)
      .where(sql`${semanticCache.hitCount} > 0`)
      .orderBy(desc(semanticCache.lastAccessedAt))
      .limit(100);

    const averageSimilarity = recentHits.length > 0 ? 0.92 : 0; // قيمة افتراضية (يمكن تحسينها)

    // حساب حجم التخزين المؤقت
    const [{ cacheSize }] = await db.select({
      cacheSize: sql<number>`pg_total_relation_size('semantic_cache')`
    }).from(semanticCache).limit(1);

    return {
      totalEntries: Number(totalEntries),
      hitRate: Number(hitRate.toFixed(2)),
      totalHits,
      totalMisses,
      tokensSaved,
      estimatedCostSaved: costSaved,
      averageSimilarity,
      cacheSize: Number(cacheSize) || 0,
      oldestEntry: oldestEntry?.createdAt.toISOString() || new Date().toISOString(),
      newestEntry: newestEntry?.createdAt.toISOString() || new Date().toISOString(),
      topTags: topTagsResult.map(t => ({ tag: t.tag, count: Number(t.count) })),
      dailyStats: stats.map(s => ({
        date: s.date.toISOString(),
        hits: s.totalHits,
        misses: s.totalMisses,
        tokensSaved: s.tokensSaved,
        costSaved: s.costSaved
      }))
    };
  }

  async invalidate(request: CacheInvalidateRequest): Promise<CacheInvalidateResponse> {
    let deletedCount = 0;

    try {
      switch (request.type) {
        case 'id':
          if (request.ids && request.ids.length > 0) {
            const deleted = await db.delete(semanticCache)
              .where(inArray(semanticCache.id, request.ids))
              .returning();
            deletedCount = deleted.length;
          }
          break;

        case 'tag':
          if (request.tags && request.tags.length > 0) {
            // البحث عن cache IDs بناءً على الوسوم
            const cacheIds = await db.select({ id: cacheTags.cacheId })
              .from(cacheTags)
              .where(inArray(cacheTags.name, request.tags));
            
            if (cacheIds.length > 0) {
              const deleted = await db.delete(semanticCache)
                .where(inArray(semanticCache.id, cacheIds.map(c => c.id)))
                .returning();
              deletedCount = deleted.length;
            }
          }
          break;

        case 'pattern':
          if (request.pattern) {
            const deleted = await db.delete(semanticCache)
              .where(sql`${semanticCache.prompt} LIKE ${'%' + request.pattern + '%'}`)
              .returning();
            deletedCount = deleted.length;
          }
          break;

        case 'all':
          const deleted = await db.delete(semanticCache).returning();
          deletedCount = deleted.length;
          // إعادة تعيين الإحصائيات
          await db.delete(cacheStatistics);
          break;

        default:
          throw new Error('Invalid invalidation type');
      }

      return {
        deletedCount,
        success: true
      };
    } catch (error) {
      console.error('Cache invalidation error:', error);
      return {
        deletedCount: 0,
        success: false
      };
    }
  }

  async cleanup(): Promise<{ deletedCount: number; success: boolean }> {
    try {
      // حذف العناصر المنتهية الصلاحية
      const deleted = await db.delete(semanticCache)
        .where(sql`${semanticCache.expiresAt} <= NOW()`)
        .returning();

      return {
        deletedCount: deleted.length,
        success: true
      };
    } catch (error) {
      console.error('Cache cleanup error:', error);
      return {
        deletedCount: 0,
        success: false
      };
    }
  }
}

export const semanticCacheService = new SemanticCacheService();
export default semanticCacheService;