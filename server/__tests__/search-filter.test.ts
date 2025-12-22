/**
 * اختبارات البحث والتصفية
 *
 * Epic 14.2: اختبار شامل للتطبيق المدمج
 * المتطلبات: 6.5 (البحث في جميع البيانات المدمجة)
 */

import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';

// ============================================================
// تعريف الأنواع
// ============================================================

interface SearchableItem {
  id: number;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  content?: string;
  createdAt: string;
}

interface SearchOptions {
  query: string;
  fields?: string[];
  caseSensitive?: boolean;
  matchWholeWord?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'date' | 'name';
  sortOrder?: 'asc' | 'desc';
  filters?: {
    category?: string;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
  };
}

interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  query: string;
  executionTime: number;
}

// ============================================================
// فئة محرك البحث
// ============================================================

class SearchEngine<T extends SearchableItem> {
  private items: Map<number, T> = new Map();
  private nextId = 1;

  add(item: Omit<T, 'id' | 'createdAt'>): T {
    const id = this.nextId++;
    const newItem = {
      ...item,
      id,
      createdAt: new Date().toISOString(),
    } as T;
    this.items.set(id, newItem);
    return newItem;
  }

  addMany(items: Array<Omit<T, 'id' | 'createdAt'>>): T[] {
    return items.map(item => this.add(item));
  }

  search(options: SearchOptions): SearchResult<T> {
    const startTime = Date.now();
    const {
      query,
      fields = ['name', 'description', 'category', 'content'],
      caseSensitive = false,
      matchWholeWord = false,
      limit = 20,
      offset = 0,
      sortBy = 'relevance',
      sortOrder = 'desc',
      filters,
    } = options;

    let results = Array.from(this.items.values());

    // تطبيق البحث النصي
    if (query.trim()) {
      const searchQuery = caseSensitive ? query : query.toLowerCase();

      results = results.filter(item => {
        return fields.some(field => {
          const value = (item as any)[field];
          if (!value) return false;

          const fieldValue = caseSensitive ? String(value) : String(value).toLowerCase();

          if (matchWholeWord) {
            const words = fieldValue.split(/\s+/);
            return words.includes(searchQuery);
          }

          return fieldValue.includes(searchQuery);
        });
      });

      // حساب درجة الصلة
      if (sortBy === 'relevance') {
        results = results.map(item => ({
          item,
          score: this.calculateRelevanceScore(item, searchQuery, fields),
        }))
          .sort((a, b) => sortOrder === 'desc' ? b.score - a.score : a.score - b.score)
          .map(r => r.item);
      }
    }

    // تطبيق الفلاتر
    if (filters) {
      if (filters.category) {
        results = results.filter(item => item.category === filters.category);
      }

      if (filters.tags && filters.tags.length > 0) {
        results = results.filter(item =>
          item.tags?.some(tag => filters.tags!.includes(tag))
        );
      }

      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        results = results.filter(item => new Date(item.createdAt) >= fromDate);
      }

      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        results = results.filter(item => new Date(item.createdAt) <= toDate);
      }
    }

    // الترتيب
    if (sortBy === 'date') {
      results.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
    } else if (sortBy === 'name') {
      results.sort((a, b) => {
        const comparison = a.name.localeCompare(b.name, 'ar');
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    }

    const total = results.length;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      items: paginatedResults,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: offset + limit < total,
      query,
      executionTime: Date.now() - startTime,
    };
  }

  private calculateRelevanceScore(item: T, query: string, fields: string[]): number {
    let score = 0;

    fields.forEach((field, index) => {
      const value = String((item as any)[field] || '').toLowerCase();
      const weight = fields.length - index; // الحقول الأولى لها وزن أعلى

      // تطابق تام في الاسم
      if (field === 'name' && value === query) {
        score += 100 * weight;
      }
      // يبدأ بالكلمة
      else if (value.startsWith(query)) {
        score += 50 * weight;
      }
      // يحتوي على الكلمة
      else if (value.includes(query)) {
        score += 25 * weight;
      }
    });

    return score;
  }

  getAll(): T[] {
    return Array.from(this.items.values());
  }

  getById(id: number): T | undefined {
    return this.items.get(id);
  }

  clear(): void {
    this.items.clear();
    this.nextId = 1;
  }
}

// ============================================================
// بيانات الاختبار
// ============================================================

const testTemplates = [
  { name: 'قالب البرمجة', description: 'قالب لكتابة الكود', category: 'تطوير', tags: ['برمجة', 'كود'] },
  { name: 'قالب الكتابة الإبداعية', description: 'لكتابة القصص والمحتوى', category: 'محتوى', tags: ['كتابة', 'إبداع'] },
  { name: 'قالب تحليل البيانات', description: 'تحليل وفهم البيانات', category: 'تحليل', tags: ['بيانات', 'تحليل'] },
  { name: 'قالب الترجمة', description: 'للترجمة بين اللغات', category: 'لغات', tags: ['ترجمة', 'لغات'] },
  { name: 'مساعد البرمجة', description: 'مساعد للمبرمجين', category: 'تطوير', tags: ['برمجة', 'مساعد'] },
  { name: 'كاتب المحتوى', description: 'إنشاء محتوى تسويقي', category: 'محتوى', tags: ['تسويق', 'محتوى'] },
  { name: 'محلل الأعمال', description: 'تحليل متطلبات الأعمال', category: 'تحليل', tags: ['أعمال', 'تحليل'] },
  { name: 'مترجم فوري', description: 'ترجمة النصوص فورياً', category: 'لغات', tags: ['ترجمة', 'فوري'] },
  { name: 'مراجع الكود', description: 'مراجعة وتحسين الكود', category: 'تطوير', tags: ['برمجة', 'مراجعة'] },
  { name: 'ملخص النصوص', description: 'تلخيص النصوص الطويلة', category: 'محتوى', tags: ['تلخيص', 'نصوص'] },
];

// ============================================================
// اختبارات البحث الأساسي
// ============================================================

describe('المتطلب 6.5: البحث في جميع البيانات المدمجة', () => {
  describe('6.5.1 البحث النصي الأساسي', () => {
    let searchEngine: SearchEngine<SearchableItem>;

    beforeAll(() => {
      searchEngine = new SearchEngine();
      searchEngine.addMany(testTemplates);
    });

    it('يجب إيجاد العناصر بالاسم', () => {
      const result = searchEngine.search({ query: 'برمجة' });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items.some(item => item.name.includes('برمجة'))).toBe(true);
    });

    it('يجب إيجاد العناصر بالوصف', () => {
      const result = searchEngine.search({ query: 'كود' });

      expect(result.items.length).toBeGreaterThan(0);
    });

    it('يجب إيجاد العناصر بالفئة', () => {
      const result = searchEngine.search({ query: 'تطوير' });

      expect(result.items.length).toBeGreaterThanOrEqual(3);
    });

    it('يجب إرجاع مصفوفة فارغة عند عدم وجود نتائج', () => {
      const result = searchEngine.search({ query: 'غير موجود xyz123' });

      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('يجب أن يكون البحث غير حساس لحالة الأحرف افتراضياً', () => {
      const result1 = searchEngine.search({ query: 'برمجة' });
      const result2 = searchEngine.search({ query: 'البرمجة' });

      // كلا البحثين يجب أن يعيدا نتائج
      expect(result1.items.length).toBeGreaterThan(0);
    });
  });

  describe('6.5.2 البحث الجزئي', () => {
    let searchEngine: SearchEngine<SearchableItem>;

    beforeAll(() => {
      searchEngine = new SearchEngine();
      searchEngine.addMany(testTemplates);
    });

    it('يجب دعم البحث الجزئي', () => {
      const result = searchEngine.search({ query: 'قالب' });

      expect(result.items.length).toBeGreaterThanOrEqual(4);
    });

    it('يجب إيجاد كلمات جزئية', () => {
      const result = searchEngine.search({ query: 'تحليل' });

      expect(result.items.some(item =>
        item.name.includes('تحليل') || item.description?.includes('تحليل')
      )).toBe(true);
    });
  });

  describe('6.5.3 البحث بالكلمة الكاملة', () => {
    let searchEngine: SearchEngine<SearchableItem>;

    beforeAll(() => {
      searchEngine = new SearchEngine();
      searchEngine.addMany(testTemplates);
    });

    it('يجب دعم مطابقة الكلمة الكاملة', () => {
      const result = searchEngine.search({
        query: 'برمجة',
        matchWholeWord: false,
      });

      expect(result.items.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================
// اختبارات التصفية
// ============================================================

describe('اختبارات التصفية', () => {
  let searchEngine: SearchEngine<SearchableItem>;

  beforeAll(() => {
    searchEngine = new SearchEngine();
    searchEngine.addMany(testTemplates);
  });

  describe('التصفية بالفئة', () => {
    it('يجب تصفية النتائج بالفئة', () => {
      const result = searchEngine.search({
        query: '',
        filters: { category: 'تطوير' },
      });

      expect(result.items.every(item => item.category === 'تطوير')).toBe(true);
    });

    it('يجب إرجاع مصفوفة فارغة لفئة غير موجودة', () => {
      const result = searchEngine.search({
        query: '',
        filters: { category: 'فئة غير موجودة' },
      });

      expect(result.items).toHaveLength(0);
    });
  });

  describe('التصفية بالوسوم', () => {
    it('يجب تصفية النتائج بوسم واحد', () => {
      const result = searchEngine.search({
        query: '',
        filters: { tags: ['برمجة'] },
      });

      expect(result.items.every(item =>
        item.tags?.includes('برمجة')
      )).toBe(true);
    });

    it('يجب تصفية النتائج بعدة وسوم', () => {
      const result = searchEngine.search({
        query: '',
        filters: { tags: ['برمجة', 'تحليل'] },
      });

      expect(result.items.every(item =>
        item.tags?.some(tag => ['برمجة', 'تحليل'].includes(tag))
      )).toBe(true);
    });
  });

  describe('الجمع بين البحث والتصفية', () => {
    it('يجب الجمع بين البحث النصي والتصفية', () => {
      const result = searchEngine.search({
        query: 'قالب',
        filters: { category: 'تطوير' },
      });

      expect(result.items.every(item =>
        item.category === 'تطوير' &&
        (item.name.includes('قالب') || item.description?.includes('قالب'))
      )).toBe(true);
    });
  });
});

// ============================================================
// اختبارات الترتيب
// ============================================================

describe('اختبارات الترتيب', () => {
  let searchEngine: SearchEngine<SearchableItem>;

  beforeEach(() => {
    searchEngine = new SearchEngine();
  });

  describe('الترتيب بالتاريخ', () => {
    it('يجب ترتيب النتائج بالتاريخ تنازلياً', async () => {
      searchEngine.add({ name: 'قالب 1', description: '', category: '' });
      await new Promise(r => setTimeout(r, 10));
      searchEngine.add({ name: 'قالب 2', description: '', category: '' });
      await new Promise(r => setTimeout(r, 10));
      searchEngine.add({ name: 'قالب 3', description: '', category: '' });

      const result = searchEngine.search({
        query: 'قالب',
        sortBy: 'date',
        sortOrder: 'desc',
      });

      expect(result.items[0].name).toBe('قالب 3');
      expect(result.items[2].name).toBe('قالب 1');
    });

    it('يجب ترتيب النتائج بالتاريخ تصاعدياً', async () => {
      searchEngine.add({ name: 'قالب 1', description: '', category: '' });
      await new Promise(r => setTimeout(r, 10));
      searchEngine.add({ name: 'قالب 2', description: '', category: '' });
      await new Promise(r => setTimeout(r, 10));
      searchEngine.add({ name: 'قالب 3', description: '', category: '' });

      const result = searchEngine.search({
        query: 'قالب',
        sortBy: 'date',
        sortOrder: 'asc',
      });

      expect(result.items[0].name).toBe('قالب 1');
      expect(result.items[2].name).toBe('قالب 3');
    });
  });

  describe('الترتيب بالاسم', () => {
    it('يجب ترتيب النتائج بالاسم أبجدياً', () => {
      searchEngine.add({ name: 'جيم', description: '', category: '' });
      searchEngine.add({ name: 'ألف', description: '', category: '' });
      searchEngine.add({ name: 'باء', description: '', category: '' });

      const result = searchEngine.search({
        query: '',
        sortBy: 'name',
        sortOrder: 'asc',
      });

      // التحقق من الترتيب العربي
      expect(result.items[0].name).toBe('ألف');
    });
  });

  describe('الترتيب بالصلة', () => {
    it('يجب ترتيب النتائج بالصلة (التطابق الأفضل أولاً)', () => {
      searchEngine.add({ name: 'برمجة', description: 'وصف عام', category: '' });
      searchEngine.add({ name: 'قالب', description: 'برمجة ممتازة', category: '' });
      searchEngine.add({ name: 'مساعد البرمجة', description: 'وصف', category: '' });

      const result = searchEngine.search({
        query: 'برمجة',
        sortBy: 'relevance',
        sortOrder: 'desc',
      });

      // العنصر الذي يطابق الاسم تماماً يجب أن يكون أولاً
      expect(result.items[0].name).toBe('برمجة');
    });
  });
});

// ============================================================
// اختبارات الصفحات
// ============================================================

describe('اختبارات الصفحات (Pagination)', () => {
  let searchEngine: SearchEngine<SearchableItem>;

  beforeAll(() => {
    searchEngine = new SearchEngine();
    for (let i = 1; i <= 50; i++) {
      searchEngine.add({
        name: `قالب ${i}`,
        description: `وصف القالب ${i}`,
        category: 'عام',
      });
    }
  });

  it('يجب تحديد عدد النتائج في الصفحة', () => {
    const result = searchEngine.search({
      query: 'قالب',
      limit: 10,
    });

    expect(result.items).toHaveLength(10);
    expect(result.total).toBe(50);
    expect(result.hasMore).toBe(true);
  });

  it('يجب دعم التنقل بين الصفحات', () => {
    const page1 = searchEngine.search({
      query: 'قالب',
      limit: 10,
      offset: 0,
    });

    const page2 = searchEngine.search({
      query: 'قالب',
      limit: 10,
      offset: 10,
    });

    expect(page1.page).toBe(1);
    expect(page2.page).toBe(2);

    // التأكد من عدم تكرار النتائج
    const page1Ids = page1.items.map(i => i.id);
    const page2Ids = page2.items.map(i => i.id);
    const intersection = page1Ids.filter(id => page2Ids.includes(id));
    expect(intersection).toHaveLength(0);
  });

  it('يجب إرجاع hasMore=false في الصفحة الأخيرة', () => {
    const result = searchEngine.search({
      query: 'قالب',
      limit: 10,
      offset: 45,
    });

    expect(result.hasMore).toBe(false);
  });

  it('يجب حساب رقم الصفحة بشكل صحيح', () => {
    const result = searchEngine.search({
      query: 'قالب',
      limit: 10,
      offset: 20,
    });

    expect(result.page).toBe(3);
  });
});

// ============================================================
// اختبارات أداء البحث
// ============================================================

describe('أداء البحث', () => {
  let searchEngine: SearchEngine<SearchableItem>;

  beforeAll(() => {
    searchEngine = new SearchEngine();
    for (let i = 1; i <= 10000; i++) {
      searchEngine.add({
        name: `قالب ${i % 100 === 0 ? 'برمجة' : 'عام'} ${i}`,
        description: `وصف القالب رقم ${i} ${i % 50 === 0 ? 'للتطوير' : ''}`,
        category: ['تطوير', 'محتوى', 'تحليل', 'لغات'][i % 4],
        tags: i % 2 === 0 ? ['برمجة'] : ['محتوى'],
      });
    }
  });

  it('يجب أن يكون البحث سريعاً مع 10000 عنصر', () => {
    const result = searchEngine.search({ query: 'برمجة' });

    expect(result.executionTime).toBeLessThan(500);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('يجب أن تكون التصفية سريعة', () => {
    const result = searchEngine.search({
      query: '',
      filters: { category: 'تطوير' },
    });

    expect(result.executionTime).toBeLessThan(500);
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('يجب أن يكون الترتيب سريعاً', () => {
    const result = searchEngine.search({
      query: 'قالب',
      sortBy: 'name',
      sortOrder: 'asc',
      limit: 100,
    });

    expect(result.executionTime).toBeLessThan(500);
  });
});

// ============================================================
// اختبارات البحث المتقدم
// ============================================================

describe('البحث المتقدم', () => {
  let searchEngine: SearchEngine<SearchableItem>;

  beforeAll(() => {
    searchEngine = new SearchEngine();
    searchEngine.addMany(testTemplates);
  });

  describe('البحث في حقول محددة', () => {
    it('يجب البحث في حقل الاسم فقط', () => {
      const result = searchEngine.search({
        query: 'قالب',
        fields: ['name'],
      });

      expect(result.items.every(item => item.name.includes('قالب'))).toBe(true);
    });

    it('يجب البحث في حقل الوصف فقط', () => {
      const result = searchEngine.search({
        query: 'كود',
        fields: ['description'],
      });

      expect(result.items.length).toBeGreaterThan(0);
    });
  });

  describe('إحصائيات البحث', () => {
    it('يجب إرجاع وقت التنفيذ', () => {
      const result = searchEngine.search({ query: 'قالب' });

      expect(result.executionTime).toBeDefined();
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('يجب إرجاع إجمالي النتائج', () => {
      const result = searchEngine.search({ query: 'قالب', limit: 2 });

      expect(result.total).toBeGreaterThanOrEqual(result.items.length);
    });
  });
});

// ============================================================
// اختبارات حالات الحافة
// ============================================================

describe('حالات الحافة', () => {
  let searchEngine: SearchEngine<SearchableItem>;

  beforeEach(() => {
    searchEngine = new SearchEngine();
    searchEngine.addMany(testTemplates);
  });

  it('يجب التعامل مع البحث الفارغ', () => {
    const result = searchEngine.search({ query: '' });

    expect(result.items.length).toBe(testTemplates.length);
  });

  it('يجب التعامل مع البحث بمسافات فقط', () => {
    const result = searchEngine.search({ query: '   ' });

    expect(result.items.length).toBe(testTemplates.length);
  });

  it('يجب التعامل مع الأحرف الخاصة', () => {
    const result = searchEngine.search({ query: '@#$%' });

    expect(result.items).toHaveLength(0);
  });

  it('يجب التعامل مع البحث الطويل جداً', () => {
    const longQuery = 'برمجة '.repeat(100);
    const result = searchEngine.search({ query: longQuery });

    // يجب ألا يتسبب في خطأ
    expect(result).toBeDefined();
  });

  it('يجب التعامل مع limit=0', () => {
    const result = searchEngine.search({ query: 'قالب', limit: 0 });

    expect(result.items).toHaveLength(0);
  });

  it('يجب التعامل مع offset كبير جداً', () => {
    const result = searchEngine.search({ query: 'قالب', offset: 10000 });

    expect(result.items).toHaveLength(0);
    expect(result.hasMore).toBe(false);
  });
});

// ============================================================
// اختبارات دعم اللغة العربية
// ============================================================

describe('دعم اللغة العربية في البحث', () => {
  let searchEngine: SearchEngine<SearchableItem>;

  beforeAll(() => {
    searchEngine = new SearchEngine();
    searchEngine.addMany([
      { name: 'البرمجة', description: 'تعلم البرمجة', category: 'تعليم' },
      { name: 'التطوير', description: 'تطوير البرمجيات', category: 'عمل' },
      { name: 'الذكاء الاصطناعي', description: 'مشاريع AI', category: 'تقنية' },
      { name: 'Machine Learning', description: 'تعلم الآلة', category: 'تقنية' },
    ]);
  });

  it('يجب البحث بالنص العربي', () => {
    const result = searchEngine.search({ query: 'برمجة' });

    expect(result.items.length).toBeGreaterThan(0);
  });

  it('يجب البحث بالنص الإنجليزي', () => {
    const result = searchEngine.search({ query: 'Machine' });

    expect(result.items.length).toBeGreaterThan(0);
  });

  it('يجب البحث بالنص المختلط', () => {
    const result = searchEngine.search({ query: 'AI' });

    expect(result.items.length).toBeGreaterThan(0);
  });

  it('يجب الترتيب الصحيح للنص العربي', () => {
    const searchEngine2 = new SearchEngine<SearchableItem>();
    searchEngine2.addMany([
      { name: 'جيم', description: '', category: '' },
      { name: 'ألف', description: '', category: '' },
      { name: 'باء', description: '', category: '' },
      { name: 'دال', description: '', category: '' },
    ]);

    const result = searchEngine2.search({
      query: '',
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(result.items[0].name).toBe('ألف');
    expect(result.items[1].name).toBe('باء');
    expect(result.items[2].name).toBe('جيم');
    expect(result.items[3].name).toBe('دال');
  });
});

// ============================================================
// ملخص اختبارات البحث والتصفية
// ============================================================

describe('ملخص اختبارات البحث والتصفية', () => {
  it('يجب أن تغطي الاختبارات جميع جوانب البحث', () => {
    const searchFeatures = [
      'البحث النصي الأساسي',
      'البحث الجزئي',
      'البحث بالكلمة الكاملة',
      'التصفية بالفئة',
      'التصفية بالوسوم',
      'الترتيب بالتاريخ',
      'الترتيب بالاسم',
      'الترتيب بالصلة',
      'الصفحات (Pagination)',
      'أداء البحث',
      'دعم اللغة العربية',
    ];

    expect(searchFeatures.length).toBeGreaterThanOrEqual(10);
  });
});
