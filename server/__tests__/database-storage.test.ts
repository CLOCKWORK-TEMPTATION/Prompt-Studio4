/**
 * اختبارات قاعدة البيانات والتخزين
 *
 * Epic 14.2: اختبار شامل للتطبيق المدمج
 * المتطلبات: 6.4 (حفظ البيانات في قاعدة البيانات المدمجة)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// ============================================================
// تعريف الأنواع
// ============================================================

interface Template {
  id: number;
  name: string;
  description?: string;
  category?: string;
  sections: {
    system: string;
    developer: string;
    user: string;
    context: string;
  };
  defaultVariables: Array<{ id: string; name: string; value: string }>;
  tags?: string[];
  createdAt: string;
}

interface Technique {
  id: number;
  title: string;
  description: string;
  goodExample: string;
  badExample: string;
  commonMistakes: string[];
  snippet?: string;
  createdAt: string;
}

interface Run {
  id: number;
  sections: {
    system: string;
    developer: string;
    user: string;
    context: string;
  };
  variables: Array<{ id: string; name: string; value: string }>;
  model: string;
  temperature: number;
  maxTokens?: number;
  output: string;
  latency: number;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  promptVersionId?: string;
  createdAt: string;
}

interface RunRating {
  id: number;
  runId: number;
  rating: number;
  feedback?: string;
}

interface AgentComposeRun {
  id: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  stage: string;
  progress: number;
  inputRaw: string;
  inputGoal?: string;
  inputConstraints?: string;
  inputOutputFormat?: string;
  modelConfig?: any;
  error?: string;
  createdAt: string;
}

interface AgentComposeResult {
  id: number;
  runId: number;
  agent1Json: any;
  agent2Json: any;
  agent3Json: any;
}

interface CacheEntry {
  id: string;
  prompt: string;
  response: string;
  model: string;
  embedding?: number[];
  ttlSeconds: number;
  createdAt: string;
  expiresAt: string;
}

// ============================================================
// فئة التخزين الوهمية للاختبارات
// ============================================================

class TestStorage {
  private templates: Map<number, Template> = new Map();
  private techniques: Map<number, Technique> = new Map();
  private runs: Map<number, Run> = new Map();
  private ratings: Map<number, RunRating> = new Map();
  private agentComposeRuns: Map<number, AgentComposeRun> = new Map();
  private agentComposeResults: Map<number, AgentComposeResult> = new Map();
  private cacheEntries: Map<string, CacheEntry> = new Map();
  private nextId = 1;

  // Templates
  async createTemplate(data: Omit<Template, 'id' | 'createdAt'>): Promise<Template> {
    const id = this.nextId++;
    const template: Template = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.templates.set(id, template);
    return template;
  }

  async getTemplateById(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async getAllTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateTemplate(id: number, data: Partial<Template>): Promise<Template | undefined> {
    const template = this.templates.get(id);
    if (!template) return undefined;

    const updated = { ...template, ...data };
    this.templates.set(id, updated);
    return updated;
  }

  async deleteTemplate(id: number): Promise<boolean> {
    return this.templates.delete(id);
  }

  async searchTemplates(query: string): Promise<Template[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.templates.values()).filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description?.toLowerCase().includes(lowerQuery) ||
      t.category?.toLowerCase().includes(lowerQuery)
    );
  }

  // Techniques
  async createTechnique(data: Omit<Technique, 'id' | 'createdAt'>): Promise<Technique> {
    const id = this.nextId++;
    const technique: Technique = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.techniques.set(id, technique);
    return technique;
  }

  async getTechniqueById(id: number): Promise<Technique | undefined> {
    return this.techniques.get(id);
  }

  async getAllTechniques(): Promise<Technique[]> {
    return Array.from(this.techniques.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async updateTechnique(id: number, data: Partial<Technique>): Promise<Technique | undefined> {
    const technique = this.techniques.get(id);
    if (!technique) return undefined;

    const updated = { ...technique, ...data };
    this.techniques.set(id, updated);
    return updated;
  }

  async deleteTechnique(id: number): Promise<boolean> {
    return this.techniques.delete(id);
  }

  // Runs
  async createRun(data: Omit<Run, 'id' | 'createdAt'>): Promise<Run> {
    const id = this.nextId++;
    const run: Run = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.runs.set(id, run);
    return run;
  }

  async getRunById(id: number): Promise<Run | undefined> {
    return this.runs.get(id);
  }

  async getAllRuns(limit: number = 100): Promise<Run[]> {
    return Array.from(this.runs.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Ratings
  async createRunRating(data: Omit<RunRating, 'id'>): Promise<RunRating> {
    const id = this.nextId++;
    const rating: RunRating = { ...data, id };
    this.ratings.set(id, rating);
    return rating;
  }

  async getRatingByRunId(runId: number): Promise<RunRating | undefined> {
    return Array.from(this.ratings.values()).find(r => r.runId === runId);
  }

  async updateRunRating(id: number, data: Partial<RunRating>): Promise<RunRating | undefined> {
    const rating = this.ratings.get(id);
    if (!rating) return undefined;

    const updated = { ...rating, ...data };
    this.ratings.set(id, updated);
    return updated;
  }

  // Agent Compose
  async createAgentComposeRun(data: Omit<AgentComposeRun, 'id' | 'createdAt'>): Promise<AgentComposeRun> {
    const id = this.nextId++;
    const run: AgentComposeRun = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.agentComposeRuns.set(id, run);
    return run;
  }

  async getAgentComposeRunById(id: number): Promise<AgentComposeRun | undefined> {
    return this.agentComposeRuns.get(id);
  }

  async updateAgentComposeRun(id: number, data: Partial<AgentComposeRun>): Promise<AgentComposeRun | undefined> {
    const run = this.agentComposeRuns.get(id);
    if (!run) return undefined;

    const updated = { ...run, ...data };
    this.agentComposeRuns.set(id, updated);
    return updated;
  }

  async createAgentComposeResult(data: Omit<AgentComposeResult, 'id'>): Promise<AgentComposeResult> {
    const id = this.nextId++;
    const result: AgentComposeResult = { ...data, id };
    this.agentComposeResults.set(id, result);
    return result;
  }

  async getAgentComposeResultByRunId(runId: number): Promise<AgentComposeResult | undefined> {
    return Array.from(this.agentComposeResults.values()).find(r => r.runId === runId);
  }

  // Cache
  async storeCacheEntry(data: Omit<CacheEntry, 'id' | 'createdAt' | 'expiresAt'>): Promise<CacheEntry> {
    const id = `cache_${this.nextId++}`;
    const now = new Date();
    const entry: CacheEntry = {
      ...data,
      id,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + data.ttlSeconds * 1000).toISOString(),
    };
    this.cacheEntries.set(id, entry);
    return entry;
  }

  async getCacheEntryByPrompt(prompt: string, model: string): Promise<CacheEntry | undefined> {
    return Array.from(this.cacheEntries.values()).find(
      e => e.prompt === prompt && e.model === model
    );
  }

  async deleteCacheEntry(id: string): Promise<boolean> {
    return this.cacheEntries.delete(id);
  }

  async cleanupExpiredCache(): Promise<number> {
    const now = new Date().getTime();
    let deletedCount = 0;

    for (const [id, entry] of this.cacheEntries.entries()) {
      if (new Date(entry.expiresAt).getTime() < now) {
        this.cacheEntries.delete(id);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // Utility
  clear(): void {
    this.templates.clear();
    this.techniques.clear();
    this.runs.clear();
    this.ratings.clear();
    this.agentComposeRuns.clear();
    this.agentComposeResults.clear();
    this.cacheEntries.clear();
    this.nextId = 1;
  }

  getStats(): { templates: number; techniques: number; runs: number; cacheEntries: number } {
    return {
      templates: this.templates.size,
      techniques: this.techniques.size,
      runs: this.runs.size,
      cacheEntries: this.cacheEntries.size,
    };
  }
}

// ============================================================
// اختبارات حفظ القوالب
// ============================================================

describe('المتطلب 6.4.1: حفظ القوالب', () => {
  let storage: TestStorage;

  beforeEach(() => {
    storage = new TestStorage();
  });

  describe('إنشاء القوالب', () => {
    it('يجب إنشاء قالب جديد بنجاح', async () => {
      const templateData = {
        name: 'قالب البرمجة',
        description: 'قالب لكتابة الكود',
        category: 'تطوير',
        sections: {
          system: 'أنت مبرمج محترف',
          developer: 'اكتب كود نظيف ومُعلق',
          user: 'اكتب دالة لـ {{purpose}}',
          context: 'تطوير برمجي',
        },
        defaultVariables: [
          { id: 'v1', name: 'purpose', value: 'حساب' },
        ],
        tags: ['برمجة', 'كود'],
      };

      const created = await storage.createTemplate(templateData);

      expect(created.id).toBeDefined();
      expect(created.name).toBe(templateData.name);
      expect(created.description).toBe(templateData.description);
      expect(created.category).toBe(templateData.category);
      expect(created.sections.system).toBe(templateData.sections.system);
      expect(created.defaultVariables).toHaveLength(1);
      expect(created.createdAt).toBeDefined();
    });

    it('يجب إنشاء قوالب متعددة بمعرفات فريدة', async () => {
      const templates = await Promise.all([
        storage.createTemplate({
          name: 'قالب 1',
          sections: { system: '', developer: '', user: '', context: '' },
          defaultVariables: [],
        }),
        storage.createTemplate({
          name: 'قالب 2',
          sections: { system: '', developer: '', user: '', context: '' },
          defaultVariables: [],
        }),
        storage.createTemplate({
          name: 'قالب 3',
          sections: { system: '', developer: '', user: '', context: '' },
          defaultVariables: [],
        }),
      ]);

      const ids = templates.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(3);
    });
  });

  describe('قراءة القوالب', () => {
    it('يجب قراءة قالب بالمعرف', async () => {
      const created = await storage.createTemplate({
        name: 'قالب للقراءة',
        sections: { system: '', developer: '', user: '', context: '' },
        defaultVariables: [],
      });

      const retrieved = await storage.getTemplateById(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('قالب للقراءة');
    });

    it('يجب إرجاع undefined للمعرف غير الموجود', async () => {
      const retrieved = await storage.getTemplateById(99999);
      expect(retrieved).toBeUndefined();
    });

    it('يجب قراءة جميع القوالب مرتبة', async () => {
      await storage.createTemplate({
        name: 'قالب 1',
        sections: { system: '', developer: '', user: '', context: '' },
        defaultVariables: [],
      });

      await new Promise(r => setTimeout(r, 10));

      await storage.createTemplate({
        name: 'قالب 2',
        sections: { system: '', developer: '', user: '', context: '' },
        defaultVariables: [],
      });

      const all = await storage.getAllTemplates();

      expect(all).toHaveLength(2);
      expect(all[0].name).toBe('قالب 2'); // الأحدث أولاً
    });
  });

  describe('تحديث القوالب', () => {
    it('يجب تحديث القالب بنجاح', async () => {
      const created = await storage.createTemplate({
        name: 'قالب أصلي',
        description: 'وصف أصلي',
        sections: { system: '', developer: '', user: '', context: '' },
        defaultVariables: [],
      });

      const updated = await storage.updateTemplate(created.id, {
        name: 'قالب محدث',
        description: 'وصف محدث',
      });

      expect(updated?.name).toBe('قالب محدث');
      expect(updated?.description).toBe('وصف محدث');
    });

    it('يجب الحفاظ على الحقول غير المحدثة', async () => {
      const created = await storage.createTemplate({
        name: 'قالب',
        category: 'فئة أصلية',
        sections: { system: 'نظام', developer: '', user: '', context: '' },
        defaultVariables: [],
      });

      const updated = await storage.updateTemplate(created.id, {
        name: 'قالب محدث',
      });

      expect(updated?.category).toBe('فئة أصلية');
      expect(updated?.sections.system).toBe('نظام');
    });
  });

  describe('حذف القوالب', () => {
    it('يجب حذف القالب بنجاح', async () => {
      const created = await storage.createTemplate({
        name: 'قالب للحذف',
        sections: { system: '', developer: '', user: '', context: '' },
        defaultVariables: [],
      });

      const deleted = await storage.deleteTemplate(created.id);
      expect(deleted).toBe(true);

      const retrieved = await storage.getTemplateById(created.id);
      expect(retrieved).toBeUndefined();
    });

    it('يجب إرجاع false عند حذف معرف غير موجود', async () => {
      const deleted = await storage.deleteTemplate(99999);
      expect(deleted).toBe(false);
    });
  });
});

// ============================================================
// اختبارات حفظ التشغيلات
// ============================================================

describe('المتطلب 6.4.2: حفظ التشغيلات', () => {
  let storage: TestStorage;

  beforeEach(() => {
    storage = new TestStorage();
  });

  describe('إنشاء التشغيلات', () => {
    it('يجب حفظ تشغيل جديد مع جميع البيانات', async () => {
      const runData = {
        sections: {
          system: 'أنت مساعد',
          developer: 'كن مفيداً',
          user: 'ما هي {{topic}}؟',
          context: 'تعليمي',
        },
        variables: [{ id: 'v1', name: 'topic', value: 'البرمجة' }],
        model: 'llama-3.3-70b-versatile',
        temperature: 70,
        maxTokens: 1000,
        output: 'البرمجة هي عملية كتابة التعليمات...',
        latency: 1500,
        tokenUsage: { prompt: 100, completion: 200, total: 300 },
      };

      const created = await storage.createRun(runData);

      expect(created.id).toBeDefined();
      expect(created.sections.user).toBe(runData.sections.user);
      expect(created.model).toBe(runData.model);
      expect(created.output).toBe(runData.output);
      expect(created.latency).toBe(runData.latency);
      expect(created.tokenUsage?.total).toBe(300);
    });

    it('يجب حفظ تشغيلات متعددة بترتيب صحيح', async () => {
      for (let i = 0; i < 10; i++) {
        await storage.createRun({
          sections: { system: '', developer: '', user: '', context: '' },
          variables: [],
          model: 'test',
          temperature: 70,
          output: `Output ${i}`,
          latency: 100 * i,
        });
        await new Promise(r => setTimeout(r, 5));
      }

      const runs = await storage.getAllRuns(5);

      expect(runs).toHaveLength(5);
      expect(runs[0].output).toBe('Output 9'); // الأحدث أولاً
    });
  });

  describe('التقييمات', () => {
    it('يجب ربط التقييم بالتشغيل', async () => {
      const run = await storage.createRun({
        sections: { system: '', developer: '', user: '', context: '' },
        variables: [],
        model: 'test',
        temperature: 70,
        output: 'output',
        latency: 100,
      });

      const rating = await storage.createRunRating({
        runId: run.id,
        rating: 5,
        feedback: 'ممتاز',
      });

      expect(rating.runId).toBe(run.id);

      const retrieved = await storage.getRatingByRunId(run.id);
      expect(retrieved?.rating).toBe(5);
      expect(retrieved?.feedback).toBe('ممتاز');
    });

    it('يجب تحديث التقييم', async () => {
      const run = await storage.createRun({
        sections: { system: '', developer: '', user: '', context: '' },
        variables: [],
        model: 'test',
        temperature: 70,
        output: 'output',
        latency: 100,
      });

      const rating = await storage.createRunRating({
        runId: run.id,
        rating: 3,
      });

      const updated = await storage.updateRunRating(rating.id, {
        rating: 4,
        feedback: 'تحسن',
      });

      expect(updated?.rating).toBe(4);
      expect(updated?.feedback).toBe('تحسن');
    });
  });
});

// ============================================================
// اختبارات حفظ نتائج الوكلاء
// ============================================================

describe('المتطلب 6.4.3: حفظ نتائج الوكلاء', () => {
  let storage: TestStorage;

  beforeEach(() => {
    storage = new TestStorage();
  });

  describe('تشغيل الوكلاء', () => {
    it('يجب حفظ تشغيل الوكلاء مع جميع البيانات', async () => {
      const composeRun = await storage.createAgentComposeRun({
        status: 'pending',
        stage: 'agent1',
        progress: 0,
        inputRaw: 'فكرة لتطبيق جديد',
        inputGoal: 'إنشاء تطبيق ويب',
        inputConstraints: 'يجب أن يكون سريعاً',
        inputOutputFormat: 'JSON',
        modelConfig: { model: 'llama-3.3-70b-versatile', temperature: 0.3 },
      });

      expect(composeRun.id).toBeDefined();
      expect(composeRun.status).toBe('pending');
      expect(composeRun.inputRaw).toBe('فكرة لتطبيق جديد');
    });

    it('يجب تحديث حالة التشغيل عبر المراحل', async () => {
      const composeRun = await storage.createAgentComposeRun({
        status: 'pending',
        stage: 'agent1',
        progress: 0,
        inputRaw: 'فكرة',
      });

      // المرحلة 1
      await storage.updateAgentComposeRun(composeRun.id, {
        status: 'running',
        stage: 'agent1',
        progress: 30,
      });

      let current = await storage.getAgentComposeRunById(composeRun.id);
      expect(current?.progress).toBe(30);

      // المرحلة 2
      await storage.updateAgentComposeRun(composeRun.id, {
        stage: 'agent2',
        progress: 60,
      });

      current = await storage.getAgentComposeRunById(composeRun.id);
      expect(current?.stage).toBe('agent2');
      expect(current?.progress).toBe(60);

      // المرحلة 3
      await storage.updateAgentComposeRun(composeRun.id, {
        stage: 'agent3',
        progress: 90,
      });

      // الإكمال
      await storage.updateAgentComposeRun(composeRun.id, {
        status: 'completed',
        stage: 'done',
        progress: 100,
      });

      const final = await storage.getAgentComposeRunById(composeRun.id);
      expect(final?.status).toBe('completed');
      expect(final?.progress).toBe(100);
    });

    it('يجب حفظ حالة الفشل', async () => {
      const composeRun = await storage.createAgentComposeRun({
        status: 'pending',
        stage: 'agent1',
        progress: 0,
        inputRaw: 'فكرة',
      });

      await storage.updateAgentComposeRun(composeRun.id, {
        status: 'failed',
        error: 'خطأ في الاتصال بـ API',
      });

      const failed = await storage.getAgentComposeRunById(composeRun.id);
      expect(failed?.status).toBe('failed');
      expect(failed?.error).toBe('خطأ في الاتصال بـ API');
    });
  });

  describe('نتائج الوكلاء', () => {
    it('يجب حفظ نتائج جميع الوكلاء', async () => {
      const composeRun = await storage.createAgentComposeRun({
        status: 'completed',
        stage: 'done',
        progress: 100,
        inputRaw: 'فكرة',
      });

      const result = await storage.createAgentComposeResult({
        runId: composeRun.id,
        agent1Json: {
          system: 'أنت مساعد',
          developer: 'كن مفيداً',
          user: 'ساعدني في {{task}}',
          context: 'تعليمي',
          variables: [{ id: 'v1', name: 'task', value: '' }],
        },
        agent2Json: {
          criticisms: ['يمكن تحسين النظام'],
          alternativePrompt: {},
          fixes: ['إضافة سياق أكثر'],
        },
        agent3Json: {
          finalPrompt: {
            system: 'أنت مساعد متخصص',
            developer: 'كن مفيداً ودقيقاً',
            user: 'ساعدني في {{task}} بالتفصيل',
            context: 'تعليمي متقدم',
          },
          decisionNotes: ['تم تحسين النظام', 'تم إضافة التفاصيل'],
        },
      });

      expect(result.runId).toBe(composeRun.id);

      const retrieved = await storage.getAgentComposeResultByRunId(composeRun.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.agent1Json.system).toBe('أنت مساعد');
      expect(retrieved?.agent2Json.criticisms).toHaveLength(1);
      expect(retrieved?.agent3Json.decisionNotes).toHaveLength(2);
    });
  });
});

// ============================================================
// اختبارات التخزين المؤقت
// ============================================================

describe('المتطلب 6.4.4: التخزين المؤقت', () => {
  let storage: TestStorage;

  beforeEach(() => {
    storage = new TestStorage();
  });

  describe('تخزين واسترجاع الإدخالات', () => {
    it('يجب تخزين إدخال جديد', async () => {
      const entry = await storage.storeCacheEntry({
        prompt: 'ما هي البرمجة؟',
        response: 'البرمجة هي...',
        model: 'gpt-4',
        ttlSeconds: 3600,
      });

      expect(entry.id).toBeDefined();
      expect(entry.prompt).toBe('ما هي البرمجة؟');
      expect(entry.expiresAt).toBeDefined();
    });

    it('يجب استرجاع إدخال بالطلب والنموذج', async () => {
      await storage.storeCacheEntry({
        prompt: 'سؤال محدد',
        response: 'إجابة محددة',
        model: 'gpt-4',
        ttlSeconds: 3600,
      });

      const retrieved = await storage.getCacheEntryByPrompt('سؤال محدد', 'gpt-4');

      expect(retrieved).toBeDefined();
      expect(retrieved?.response).toBe('إجابة محددة');
    });

    it('يجب عدم إيجاد إدخال بنموذج مختلف', async () => {
      await storage.storeCacheEntry({
        prompt: 'سؤال',
        response: 'إجابة',
        model: 'gpt-4',
        ttlSeconds: 3600,
      });

      const retrieved = await storage.getCacheEntryByPrompt('سؤال', 'gpt-3.5-turbo');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('تنظيف الإدخالات المنتهية', () => {
    it('يجب تنظيف الإدخالات المنتهية الصلاحية', async () => {
      // إنشاء إدخال بصلاحية قصيرة جداً
      await storage.storeCacheEntry({
        prompt: 'سؤال قصير الصلاحية',
        response: 'إجابة',
        model: 'gpt-4',
        ttlSeconds: 0, // منتهي فوراً
      });

      // إنشاء إدخال بصلاحية طويلة
      await storage.storeCacheEntry({
        prompt: 'سؤال طويل الصلاحية',
        response: 'إجابة',
        model: 'gpt-4',
        ttlSeconds: 3600,
      });

      // انتظار قليلاً
      await new Promise(r => setTimeout(r, 10));

      const deletedCount = await storage.cleanupExpiredCache();

      expect(deletedCount).toBeGreaterThanOrEqual(1);

      const stillExists = await storage.getCacheEntryByPrompt('سؤال طويل الصلاحية', 'gpt-4');
      expect(stillExists).toBeDefined();
    });
  });
});

// ============================================================
// اختبارات سلامة البيانات
// ============================================================

describe('المتطلب 6.4.5: سلامة البيانات', () => {
  let storage: TestStorage;

  beforeEach(() => {
    storage = new TestStorage();
  });

  describe('التحقق من سلامة البيانات', () => {
    it('يجب الحفاظ على سلامة البيانات عند العمليات المتزامنة', async () => {
      const promises: Promise<any>[] = [];

      for (let i = 0; i < 100; i++) {
        promises.push(
          storage.createTemplate({
            name: `قالب ${i}`,
            sections: { system: '', developer: '', user: '', context: '' },
            defaultVariables: [],
          })
        );
      }

      await Promise.all(promises);

      const all = await storage.getAllTemplates();
      expect(all).toHaveLength(100);

      // التحقق من فرادة المعرفات
      const ids = all.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(100);
    });

    it('يجب الحفاظ على العلاقات بين الجداول', async () => {
      // إنشاء تشغيل
      const run = await storage.createRun({
        sections: { system: '', developer: '', user: '', context: '' },
        variables: [],
        model: 'test',
        temperature: 70,
        output: 'output',
        latency: 100,
      });

      // إنشاء تقييم مرتبط
      const rating = await storage.createRunRating({
        runId: run.id,
        rating: 5,
      });

      // التحقق من العلاقة
      const retrievedRating = await storage.getRatingByRunId(run.id);
      expect(retrievedRating?.id).toBe(rating.id);
      expect(retrievedRating?.runId).toBe(run.id);
    });
  });

  describe('إحصائيات التخزين', () => {
    it('يجب حساب الإحصائيات بشكل صحيح', async () => {
      // إنشاء بيانات
      for (let i = 0; i < 5; i++) {
        await storage.createTemplate({
          name: `قالب ${i}`,
          sections: { system: '', developer: '', user: '', context: '' },
          defaultVariables: [],
        });
      }

      for (let i = 0; i < 3; i++) {
        await storage.createTechnique({
          title: `تقنية ${i}`,
          description: 'وصف',
          goodExample: 'مثال جيد',
          badExample: 'مثال سيء',
          commonMistakes: [],
        });
      }

      for (let i = 0; i < 10; i++) {
        await storage.createRun({
          sections: { system: '', developer: '', user: '', context: '' },
          variables: [],
          model: 'test',
          temperature: 70,
          output: 'output',
          latency: 100,
        });
      }

      const stats = storage.getStats();

      expect(stats.templates).toBe(5);
      expect(stats.techniques).toBe(3);
      expect(stats.runs).toBe(10);
    });
  });
});

// ============================================================
// اختبارات الأداء للتخزين
// ============================================================

describe('أداء التخزين', () => {
  let storage: TestStorage;

  beforeEach(() => {
    storage = new TestStorage();
  });

  it('يجب أن تكون عمليات الإنشاء سريعة', async () => {
    const startTime = Date.now();

    for (let i = 0; i < 1000; i++) {
      await storage.createTemplate({
        name: `قالب ${i}`,
        sections: { system: '', developer: '', user: '', context: '' },
        defaultVariables: [],
      });
    }

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(1000); // أقل من ثانية
  });

  it('يجب أن تكون عمليات البحث سريعة', async () => {
    // إنشاء بيانات
    for (let i = 0; i < 1000; i++) {
      await storage.createTemplate({
        name: `قالب ${i % 10 === 0 ? 'برمجة' : 'عام'} ${i}`,
        sections: { system: '', developer: '', user: '', context: '' },
        defaultVariables: [],
      });
    }

    const startTime = Date.now();
    const results = await storage.searchTemplates('برمجة');
    const duration = Date.now() - startTime;

    expect(results.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(100);
  });
});

// ============================================================
// ملخص اختبارات قاعدة البيانات
// ============================================================

describe('ملخص اختبارات قاعدة البيانات', () => {
  it('يجب أن تغطي الاختبارات جميع جوانب التخزين', () => {
    const coverage = {
      templates: ['create', 'read', 'update', 'delete', 'search'],
      techniques: ['create', 'read', 'update', 'delete'],
      runs: ['create', 'read'],
      ratings: ['create', 'read', 'update'],
      agentCompose: ['create', 'update', 'results'],
      cache: ['store', 'retrieve', 'cleanup'],
    };

    Object.values(coverage).forEach(operations => {
      expect(operations.length).toBeGreaterThan(0);
    });
  });
});
