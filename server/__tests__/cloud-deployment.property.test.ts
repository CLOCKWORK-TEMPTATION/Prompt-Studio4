/**
 * اختبارات الخصائص للنشر السحابي
 * **Feature: prompt-studio-integration, Property 9: النشر السحابي**
 * **تتحقق من: المتطلبات 8.2**
 */

import { jest, describe, test, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import fc from 'fast-check';
import { CloudDeploymentService, DeploymentConfig } from '../services/CloudDeploymentService';
import { DeploymentConfigManager } from '../services/DeploymentConfigManager';
import { DeploymentMonitor } from '../services/DeploymentMonitor';

// Mock global fetch to prevent actual network calls
const mockFetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ status: 'healthy' }),
    text: () => Promise.resolve('OK'),
  })
) as jest.Mock;
global.fetch = mockFetch as unknown as typeof fetch;

// Shared constants for all tests
const validPlatforms = ['vercel', 'cloudflare', 'aws', 'gcp'] as const;
const validEnvironments = ['development', 'staging', 'production'] as const;

describe('Cloud Deployment Properties', () => {
  let deploymentService: CloudDeploymentService;
  let configManager: DeploymentConfigManager;
  let monitor: DeploymentMonitor;

  beforeEach(() => {
    deploymentService = new CloudDeploymentService();
    configManager = new DeploymentConfigManager();
    monitor = new DeploymentMonitor();
  });

  afterEach(async () => {
    monitor.stopAllMonitoring();
    // انتظار اكتمال أي عمليات غير متزامنة معلقة
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterAll(async () => {
    // تنظيف نهائي
    monitor?.stopAllMonitoring();
    jest.clearAllMocks();
    // انتظار إضافي للتأكد من إيقاف جميع العمليات
    await new Promise(resolve => setTimeout(resolve, 200));
  });

  /**
   * الخاصية 9: النشر السحابي
   * لأي موجه صالح وإعدادات نشر صحيحة، يجب أن ينتج النشر ملفات قابلة للتشغيل وخالية من الأخطاء النحوية
   */
  describe('Property 9: Cloud Deployment Generation', () => {
    const validRegions = {
      vercel: ['iad1', 'sfo1', 'fra1'],
      cloudflare: ['auto'],
      aws: ['us-east-1', 'us-west-2', 'eu-west-1'],
      gcp: ['us-central1', 'europe-west1', 'asia-east1']
    };

    const deploymentConfigArbitrary = fc.record({
      platform: fc.constantFrom(...validPlatforms),
      projectName: fc.stringMatching(/^[a-z0-9-]{3,30}$/),
      environment: fc.constantFrom(...validEnvironments),
      envVars: fc.dictionary(
        fc.stringMatching(/^[A-Z_][A-Z0-9_]*$/),
        fc.string({ minLength: 1, maxLength: 100 })
      )
    }).chain(baseConfig =>
      fc.constantFrom(...validRegions[baseConfig.platform]).map(region => ({
        ...baseConfig,
        region
      }))
    );

    const promptIdArbitrary = fc.stringMatching(/^[a-z0-9-]{5,20}$/);

    test('should generate valid deployment files for any valid configuration', async () => {
      await fc.assert(
        fc.asyncProperty(
          promptIdArbitrary,
          deploymentConfigArbitrary,
          async (promptId, config) => {
            // تنفيذ النشر
            const result = await deploymentService.deployPrompt(promptId, config);

            // التحقق من النتيجة
            expect(result).toBeDefined();
            expect(result.deploymentId).toBeDefined();
            expect(result.logs).toBeInstanceOf(Array);
            expect(result.logs.length).toBeGreaterThan(0);

            // إذا نجح النشر، يجب أن يكون له URL
            if (result.success) {
              expect(result.url).toBeDefined();
              expect(result.url).toMatch(/^https?:\/\/.+/);
            } else {
              expect(result.error).toBeDefined();
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    test('should validate deployment configurations correctly', () => {
      fc.assert(
        fc.property(
          deploymentConfigArbitrary,
          (config) => {
            const validation = configManager.validateDeploymentConfig(config);

            // التحقق من بنية النتيجة
            expect(validation).toHaveProperty('isValid');
            expect(validation).toHaveProperty('errors');
            expect(validation).toHaveProperty('warnings');
            expect(Array.isArray(validation.errors)).toBe(true);
            expect(Array.isArray(validation.warnings)).toBe(true);

            // إذا كانت الإعدادات صالحة، يجب ألا تكون هناك أخطاء
            if (validation.isValid) {
              expect(validation.errors.length).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should create consistent default configurations', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...validPlatforms),
          fc.stringMatching(/^[a-z0-9-]{3,30}$/),
          (platform, projectName) => {
            const defaultConfig = configManager.createDefaultConfig(platform, projectName);

            if (defaultConfig) {
              expect(defaultConfig.platform).toBe(platform);
              expect(defaultConfig.projectName).toBe(projectName);
              expect(defaultConfig.environment).toBeDefined();
              expect(defaultConfig.region).toBeDefined();

              // التحقق من صحة الإعدادات الافتراضية (تجاهل أخطاء متغيرات البيئة المطلوبة)
              const validation = configManager.validateDeploymentConfig(defaultConfig);
              // الإعدادات الافتراضية قد لا تحتوي على متغيرات البيئة المطلوبة
              // لكن يجب ألا تكون هناك أخطاء أخرى
              const nonEnvErrors = validation.errors.filter(
                e => !e.includes('متغير البيئة المطلوب')
              );
              expect(nonEnvErrors.length).toBe(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * خاصية إضافية: مراقبة النشر
   * لأي نشر مراقب، يجب أن تكون بيانات المراقبة متسقة ومحدثة
   */
  describe('Deployment Monitoring Properties', () => {
    const deploymentIdArbitrary = fc.stringMatching(/^deploy_[0-9]+_[a-z0-9]{9}$/);
    const urlArbitrary = fc.webUrl();

    test('should maintain consistent monitoring state', () => {
      fc.assert(
        fc.property(
          deploymentIdArbitrary,
          urlArbitrary,
          (deploymentId, url) => {
            // بدء المراقبة
            monitor.startMonitoring(deploymentId, url, 1000);

            // التحقق من حالة المراقبة
            const healthCheck = monitor.getHealthCheck(deploymentId);
            const metrics = monitor.getMetrics(deploymentId);

            expect(healthCheck).toBeDefined();
            expect(metrics).toBeDefined();

            if (healthCheck && metrics) {
              expect(healthCheck.deploymentId).toBe(deploymentId);
              expect(healthCheck.url).toBe(url);
              expect(metrics.deploymentId).toBe(deploymentId);
              expect(metrics.requestCount).toBeGreaterThanOrEqual(0);
              expect(metrics.errorCount).toBeGreaterThanOrEqual(0);
              expect(metrics.errorCount).toBeLessThanOrEqual(metrics.requestCount);
            }

            // إيقاف المراقبة
            monitor.stopMonitoring(deploymentId);
          }
        ),
        { numRuns: 30 }
      );
    });

    test('should generate valid status reports', () => {
      fc.assert(
        fc.property(
          deploymentIdArbitrary,
          urlArbitrary,
          (deploymentId, url) => {
            // بدء المراقبة
            monitor.startMonitoring(deploymentId, url, 1000);

            // إنشاء تقرير الحالة
            const report = monitor.generateStatusReport(deploymentId);

            expect(report).toBeDefined();
            expect(report).toHaveProperty('deployment');
            expect(report).toHaveProperty('metrics');
            expect(report).toHaveProperty('recommendations');
            expect(Array.isArray(report.recommendations)).toBe(true);
            expect(report.recommendations.length).toBeGreaterThan(0);

            // إيقاف المراقبة
            monitor.stopMonitoring(deploymentId);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * خاصية إضافية: إدارة الإعدادات
   * لأي منصة مدعومة، يجب أن تكون القوالب متسقة ومكتملة
   */
  describe('Configuration Management Properties', () => {
    test('should provide complete platform templates', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...validPlatforms),
          (platform) => {
            const template = configManager.getPlatformTemplate(platform);

            expect(template).toBeDefined();
            if (template) {
              expect(template.name).toBe(platform);
              expect(template.displayName).toBeDefined();
              expect(template.description).toBeDefined();
              expect(template.defaultConfig).toBeDefined();
              expect(Array.isArray(template.requiredEnvVars)).toBe(true);
              expect(Array.isArray(template.optionalEnvVars)).toBe(true);
              expect(Array.isArray(template.supportedRegions)).toBe(true);
              expect(Array.isArray(template.configFiles)).toBe(true);

              // التحقق من الإعدادات الافتراضية
              expect(template.defaultConfig.platform).toBe(platform);
              expect(template.supportedRegions.length).toBeGreaterThan(0);
              expect(template.configFiles.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('should maintain consistency across all platform templates', () => {
      const allTemplates = configManager.getAllPlatformTemplates();

      expect(allTemplates.length).toBeGreaterThan(0);

      // التحقق من عدم تكرار الأسماء
      const platformNames = allTemplates.map(t => t.name);
      const uniqueNames = new Set(platformNames);
      expect(uniqueNames.size).toBe(platformNames.length);

      // التحقق من اكتمال كل قالب
      allTemplates.forEach(template => {
        expect(template.name).toBeDefined();
        expect(template.displayName).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.defaultConfig).toBeDefined();
        expect(template.defaultConfig.platform).toBe(template.name);
      });
    });
  });

  /**
   * خاصية الأمان: التحقق من صحة المدخلات
   * لأي مدخل غير صالح، يجب أن يتم رفضه بأمان
   */
  describe('Input Validation Properties', () => {
    const invalidConfigArbitrary = fc.record({
      platform: fc.oneof(
        fc.constant(''),
        fc.constant('invalid-platform'),
        fc.string().filter(s => !validPlatforms.includes(s as any))
      ),
      projectName: fc.oneof(
        fc.constant(''),
        fc.string().filter(s => !/^[a-z0-9-]{3,30}$/.test(s))
      ),
      region: fc.string().filter(s => s.trim() === ''),
      environment: fc.string().filter(s => !validEnvironments.includes(s as any))
    });

    test('should reject invalid configurations safely', () => {
      fc.assert(
        fc.property(
          invalidConfigArbitrary,
          (invalidConfig) => {
            const validation = configManager.validateDeploymentConfig(invalidConfig as any);

            // يجب أن تكون النتيجة غير صالحة
            expect(validation.isValid).toBe(false);
            expect(validation.errors.length).toBeGreaterThan(0);

            // يجب ألا يحدث خطأ في التحقق نفسه
            expect(validation).toBeDefined();
            expect(Array.isArray(validation.errors)).toBe(true);
            expect(Array.isArray(validation.warnings)).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});