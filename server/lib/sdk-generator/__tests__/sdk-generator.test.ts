import { describe, it, expect, beforeEach, beforeAll } from '@jest/globals';
import fc from 'fast-check';
import { SDKGenerator } from '../advanced-index';
import { PromptConfig, SDKGenerationOptions } from '../types';
import { runtimeTester, testAllSDKs } from './runtime-tester';

/**
 * Property-Based Tests for SDK Generation
 *
 * الخاصية 8: توليد SDK
 * يتحقق من: المتطلبات 8.2
 *
 * هذا الاختبار يستخدم Property-Based Testing للتأكد من:
 * 1. الاتساق: نفس المدخلات تنتج نفس المخرجات
 * 2. الشمولية: SDK المولد يحتوي على جميع العناصر المطلوبة
 * 3. الصحة: الكود المولد صحيح نحوياً
 * 4. التوافق: SDKs تعمل عبر تكوينات مختلفة
 * 5. الخصائص الرياضية: التوليد يحافظ على الخصائص المطلوبة
 */

describe('الخاصية 8: توليد SDK', () => {
  let sampleConfig: PromptConfig;

  beforeEach(() => {
    sampleConfig = {
      id: 'test-prompt-123',
      name: 'Test Prompt',
      description: 'A test prompt for SDK generation',
      prompt: 'Generate a response for {{input}}',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      stopSequences: [],
      variables: [
        {
          name: 'input',
          type: 'string',
          description: 'The input text',
          required: true,
        },
        {
          name: 'context',
          type: 'string',
          description: 'Additional context',
          required: false,
          defaultValue: '',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('Property 1: Consistency', () => {
    it('should generate identical SDKs for identical inputs', () => {
      const sdk1 = SDKGenerator.generate({
        promptConfig: sampleConfig,
        language: 'typescript',
      });

      const sdk2 = SDKGenerator.generate({
        promptConfig: sampleConfig,
        language: 'typescript',
      });

      expect(sdk1.code).toBe(sdk2.code);
      expect(sdk1.filename).toBe(sdk2.filename);
      expect(sdk1.dependencies).toEqual(sdk2.dependencies);
    });

    it('should generate consistent SDKs across multiple runs', () => {
      const sdks = Array.from({ length: 5 }, () =>
        SDKGenerator.generate({
          promptConfig: sampleConfig,
          language: 'python',
        })
      );

      const firstCode = sdks[0].code;
      sdks.forEach((sdk) => {
        expect(sdk.code).toBe(firstCode);
      });
    });
  });

  describe('Property 2: Completeness', () => {
    it('should include all required elements in TypeScript SDK', () => {
      const sdk = SDKGenerator.generate({
        promptConfig: sampleConfig,
        language: 'typescript',
      });

      // Must include class definition
      expect(sdk.code).toContain('class PromptClient');

      // Must include execute method
      expect(sdk.code).toContain('execute(');

      // Must include all variables
      sampleConfig.variables.forEach((v) => {
        expect(sdk.code).toContain(v.name);
      });

      // Must include error handling
      expect(sdk.code).toContain('PromptStudioError');

      // Must include retry logic
      expect(sdk.code).toContain('withRetry');
    });

    it('should include all required elements in Python SDK', () => {
      const sdk = SDKGenerator.generate({
        promptConfig: sampleConfig,
        language: 'python',
      });

      // Must include class definition
      expect(sdk.code).toContain('class PromptClient');

      // Must include execute method
      expect(sdk.code).toContain('def execute');

      // Must include all variables
      sampleConfig.variables.forEach((v) => {
        expect(sdk.code).toContain(v.name);
      });

      // Must include error handling
      expect(sdk.code).toContain('PromptStudioError');

      // Must include dataclasses
      expect(sdk.code).toContain('from dataclasses import dataclass');
    });

    it('should include documentation for all public methods', () => {
      const sdk = SDKGenerator.generate({
        promptConfig: sampleConfig,
        language: 'typescript',
        options: { includeDocstrings: true },
      });

      // Must include JSDoc comments
      expect(sdk.code).toContain('/**');
      expect(sdk.code).toContain('* Execute the prompt');
      expect(sdk.code).toContain('@param');
      expect(sdk.code).toContain('@returns');
    });
  });

  describe('Property 3: Syntactic Validity', () => {
    it('should generate syntactically valid TypeScript code', () => {
      const sdk = SDKGenerator.generate({
        promptConfig: sampleConfig,
        language: 'typescript',
      });

      // Basic syntax checks
      const openBraces = (sdk.code.match(/\{/g) || []).length;
      const closeBraces = (sdk.code.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);

      const openParens = (sdk.code.match(/\(/g) || []).length;
      const closeParens = (sdk.code.match(/\)/g) || []).length;
      expect(openParens).toBe(closeParens);

      // No syntax errors (basic check)
      expect(sdk.code).not.toContain('undefined');
      expect(sdk.code).not.toContain('[object Object]');
    });

    it('should generate syntactically valid Python code', () => {
      const sdk = SDKGenerator.generate({
        promptConfig: sampleConfig,
        language: 'python',
      });

      // Check indentation consistency (Python-specific)
      const lines = sdk.code.split('\n');
      lines.forEach((line, i) => {
        if (line.trim().length > 0) {
          const leadingSpaces = line.match(/^\s*/)?.[0].length || 0;
          expect(leadingSpaces % 4).toBe(0); // Python uses 4-space indentation
        }
      });

      // No syntax errors
      expect(sdk.code).not.toContain('undefined');
    });

    it('should generate valid Go code structure', () => {
      const sdk = SDKGenerator.generate({
        promptConfig: sampleConfig,
        language: 'go',
      });

      // Must have package declaration
      expect(sdk.code).toMatch(/^package \w+/m);

      // Must have proper imports
      expect(sdk.code).toContain('import (');

      // Balanced braces
      const openBraces = (sdk.code.match(/\{/g) || []).length;
      const closeBraces = (sdk.code.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });
  });

  describe('Property 4: Configuration Compatibility', () => {
    it('should handle prompts with no variables', () => {
      const configNoVars: PromptConfig = {
        ...sampleConfig,
        variables: [],
      };

      const sdk = SDKGenerator.generate({
        promptConfig: configNoVars,
        language: 'typescript',
      });

      expect(sdk.code).toBeDefined();
      expect(sdk.code.length).toBeGreaterThan(0);
    });

    it('should handle prompts with many variables', () => {
      const configManyVars: PromptConfig = {
        ...sampleConfig,
        variables: Array.from({ length: 10 }, (_, i) => ({
          name: `var${i}`,
          type: 'string',
          description: `Variable ${i}`,
          required: i % 2 === 0,
        })),
      };

      const sdk = SDKGenerator.generate({
        promptConfig: configManyVars,
        language: 'python',
      });

      expect(sdk.code).toBeDefined();
      configManyVars.variables.forEach((v) => {
        expect(sdk.code).toContain(v.name);
      });
    });

    it('should handle all variable types', () => {
      const configAllTypes: PromptConfig = {
        ...sampleConfig,
        variables: [
          { name: 'strVar', type: 'string', description: 'String', required: true },
          { name: 'numVar', type: 'number', description: 'Number', required: true },
          { name: 'boolVar', type: 'boolean', description: 'Boolean', required: true },
          { name: 'arrVar', type: 'array', description: 'Array', required: false },
          { name: 'objVar', type: 'object', description: 'Object', required: false },
        ],
      };

      const sdk = SDKGenerator.generate({
        promptConfig: configAllTypes,
        language: 'typescript',
      });

      expect(sdk.code).toContain('strVar');
      expect(sdk.code).toContain('numVar');
      expect(sdk.code).toContain('boolVar');
      expect(sdk.code).toContain('arrVar');
      expect(sdk.code).toContain('objVar');
    });
  });

  describe('Property 5: Package Generation', () => {
    it('should generate complete package with all components', () => {
      const pkg = SDKGenerator.generatePackage({
        promptConfig: sampleConfig,
        language: 'typescript',
      });

      expect(pkg.sdk).toBeDefined();
      expect(pkg.readme).toBeDefined();
      expect(pkg.packageInfo).toBeDefined();
      expect(pkg.examples).toBeDefined();

      // README should contain essential sections
      expect(pkg.readme).toContain('# Test Prompt SDK');
      expect(pkg.readme).toContain('## Installation');
      expect(pkg.readme).toContain('## Quick Start');
      expect(pkg.readme).toContain('## API Reference');
    });

    it('should generate packages for all languages', () => {
      const packages = SDKGenerator.generateAll(sampleConfig);

      expect(packages.size).toBe(5);
      expect(packages.has('typescript')).toBe(true);
      expect(packages.has('python')).toBe(true);
      expect(packages.has('javascript')).toBe(true);
      expect(packages.has('go')).toBe(true);
      expect(packages.has('curl')).toBe(true);
    });
  });

  describe('Property 6: Feature Toggles', () => {
    it('should respect asyncMode option', () => {
      const sdkAsync = SDKGenerator.generate({
        promptConfig: sampleConfig,
        language: 'typescript',
        options: { asyncMode: true },
      });

      const sdkSync = SDKGenerator.generate({
        promptConfig: sampleConfig,
        language: 'typescript',
        options: { asyncMode: false },
      });

      expect(sdkAsync.code).toContain('async');
      expect(sdkAsync.code).toContain('Promise');
    });

    it('should include retry logic when enabled', () => {
      const sdkWithRetry = SDKGenerator.generate({
        promptConfig: sampleConfig,
        language: 'typescript',
        options: { includeRetryLogic: true },
      });

      const sdkWithoutRetry = SDKGenerator.generate({
        promptConfig: sampleConfig,
        language: 'typescript',
        options: { includeRetryLogic: false },
      });

      expect(sdkWithRetry.code).toContain('withRetry');
      expect(sdkWithoutRetry.code).not.toContain('withRetry');
    });

    it('should include error handling when enabled', () => {
      const sdkWithErrors = SDKGenerator.generate({
        promptConfig: sampleConfig,
        language: 'python',
        options: { includeErrorHandling: true },
      });

      const sdkWithoutErrors = SDKGenerator.generate({
        promptConfig: sampleConfig,
        language: 'python',
        options: { includeErrorHandling: false },
      });

      expect(sdkWithErrors.code).toContain('PromptStudioError');
      expect(sdkWithErrors.code).toContain('try:');
    });
  });

  describe('Property 7: Idempotence', () => {
    it('should generate the same output when called multiple times', () => {
      const results = Array.from({ length: 10 }, () =>
        SDKGenerator.generate({
          promptConfig: sampleConfig,
          language: 'javascript',
        })
      );

      const firstCode = results[0].code;
      results.forEach((result) => {
        expect(result.code).toBe(firstCode);
      });
    });
  });

  describe('Property 8: Dependencies', () => {
    it('should list all required dependencies', () => {
      const sdk = SDKGenerator.generate({
        promptConfig: sampleConfig,
        language: 'typescript',
        options: { includeRetryLogic: true },
      });

      expect(sdk.dependencies).toContain('axios');
      expect(sdk.dependencies).toContain('axios-retry');
    });

    it('should not include optional dependencies when feature is disabled', () => {
      const sdk = SDKGenerator.generate({
        promptConfig: sampleConfig,
        language: 'typescript',
        options: { includeRetryLogic: false },
      });

      expect(sdk.dependencies).toContain('axios');
      expect(sdk.dependencies).not.toContain('axios-retry');
    });
  });
});

/**
 * Property-Based Tests - الخصائص الرياضية والوظيفية
 */
describe('اختبارات الخصائص (Property-Based)', () => {
  describe('الخاصية 8.1: الحتمية (Determinism)', () => {
    /**
     * الخاصية 8.1.1: نفس التكوين ينتج نفس الكود دائماً
     */
    it('يجب أن ينتج نفس التكوين نفس الكود دائماً', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            description: fc.string({ minLength: 1, maxLength: 100 }),
            prompt: fc.string({ minLength: 1, maxLength: 200 }),
            model: fc.constantFrom('gpt-4', 'gpt-3.5-turbo', 'llama-2-70b'),
            temperature: fc.float({ min: 0, max: 2 }),
            maxTokens: fc.integer({ min: 1, max: 4096 }),
            topP: fc.float({ min: 0, max: 1 }),
            frequencyPenalty: fc.float({ min: -2, max: 2 }),
            presencePenalty: fc.float({ min: -2, max: 2 }),
            stopSequences: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 5 }),
            variables: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 20 }),
                type: fc.constantFrom('string', 'number', 'boolean', 'array', 'object') as any,
                description: fc.string({ minLength: 1, maxLength: 50 }),
                required: fc.boolean(),
                defaultValue: fc.option(fc.anything()),
              }),
              { minLength: 0, maxLength: 10 }
            ),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          fc.constantFrom('typescript', 'python', 'javascript', 'go'),
          async (config, language) => {
            // توليد SDK 5 مرات
            const results = Array.from({ length: 5 }, () =>
              SDKGenerator.generate({
                promptConfig: config,
                language: language as any,
              })
            );

            // التأكد من أن جميع النتائج متطابقة
            const firstResult = results[0];
            results.forEach(result => {
              expect(result.code).toBe(firstResult.code);
              expect(result.filename).toBe(firstResult.filename);
              expect(result.dependencies).toEqual(firstResult.dependencies);
            });
          }
        ),
        { numRuns: 10, timeout: 60000 }
      );
    });

    /**
     * الخاصية 8.1.2: الخيارات المتطابقة تنتج نتائج متطابقة
     */
    it('يجب أن تنتج الخيارات المتطابقة نتائج متطابقة', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            promptConfig: fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              name: fc.string({ minLength: 1, maxLength: 30 }),
              description: fc.string({ minLength: 1, maxLength: 80 }),
              prompt: fc.string({ minLength: 1, maxLength: 150 }),
              model: fc.constantFrom('gpt-4', 'gpt-3.5-turbo'),
              temperature: fc.float({ min: 0, max: 1 }),
              maxTokens: fc.integer({ min: 100, max: 2000 }),
              topP: fc.float({ min: 0.1, max: 0.9 }).map(Math.fround),
              frequencyPenalty: fc.float({ min: -1, max: 1 }),
              presencePenalty: fc.float({ min: -1, max: 1 }),
              stopSequences: fc.array(fc.string({ minLength: 1, maxLength: 5 }), { minLength: 0, maxLength: 3 }),
              variables: fc.array(
                fc.record({
                  name: fc.string({ minLength: 1, maxLength: 15 }),
                  type: fc.constantFrom('string', 'number', 'boolean'),
                  description: fc.string({ minLength: 1, maxLength: 30 }),
                  required: fc.boolean(),
                  defaultValue: fc.option(fc.string()),
                }),
                { minLength: 0, maxLength: 5 }
              ),
              createdAt: fc.date(),
              updatedAt: fc.date(),
            }),
            language: fc.constantFrom('typescript', 'python'),
          }),
          fc.record({
            asyncMode: fc.boolean(),
            includeRetryLogic: fc.boolean(),
            includeErrorHandling: fc.boolean(),
            includeTypes: fc.boolean(),
            includeDocstrings: fc.boolean(),
            retryAttempts: fc.integer({ min: 1, max: 5 }),
            retryDelay: fc.integer({ min: 100, max: 2000 }),
            timeout: fc.integer({ min: 5000, max: 60000 }),
            className: fc.string({ minLength: 3, maxLength: 20 }),
            functionName: fc.string({ minLength: 3, maxLength: 20 }),
          }),
          async (request, options) => {
            // توليد SDK باستخدام نفس الخيارات
            const result1 = SDKGenerator.generate({
              ...request,
              options,
            });

            const result2 = SDKGenerator.generate({
              ...request,
              options,
            });

            expect(result1.code).toBe(result2.code);
            expect(result1.filename).toBe(result2.filename);
            expect(result1.dependencies).toEqual(result2.dependencies);
          }
        ),
        { numRuns: 8, timeout: 60000 }
      );
    });
  });

  describe('الخاصية 8.2: الشمولية (Completeness)', () => {
    /**
     * الخاصية 8.2.1: جميع المتغيرات يجب أن تظهر في الكود
     */
    it('يجب أن يحتوي الكود على جميع المتغيرات المطلوبة', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 15 }),
            name: fc.string({ minLength: 1, maxLength: 25 }),
            description: fc.string({ minLength: 1, maxLength: 60 }),
            prompt: fc.string({ minLength: 1, maxLength: 100 }),
            model: fc.constantFrom('gpt-4', 'gpt-3.5-turbo'),
            temperature: fc.float({ min: 0, max: 1 }),
            maxTokens: fc.integer({ min: 100, max: 1000 }),
            topP: fc.float({ min: 0.1, max: 0.9 }).map(Math.fround),
            frequencyPenalty: fc.float({ min: -1, max: 1 }),
            presencePenalty: fc.float({ min: -1, max: 1 }),
            stopSequences: fc.array(fc.string({ minLength: 1, maxLength: 5 }), { minLength: 0, maxLength: 2 }),
            variables: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 12 }),
                type: fc.constantFrom('string', 'number', 'boolean'),
                description: fc.string({ minLength: 1, maxLength: 25 }),
                required: fc.boolean(),
                defaultValue: fc.option(fc.string()),
              }),
              { minLength: 1, maxLength: 8 }
            ),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          fc.constantFrom('typescript', 'python'),
          async (config, language) => {
            const sdk = SDKGenerator.generate({
              promptConfig: config,
              language: language as any,
            });

            // التأكد من أن جميع المتغيرات موجودة في الكود
            config.variables.forEach(variable => {
              expect(sdk.code).toContain(variable.name);
            });
          }
        ),
        { numRuns: 15, timeout: 60000 }
      );
    });

    /**
     * الخاصية 8.2.2: الكود يجب أن يحتوي على جميع الميزات المطلوبة
     */
    it('يجب أن يحتوي الكود على الميزات المطلوبة حسب الخيارات', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            asyncMode: fc.boolean(),
            includeRetryLogic: fc.boolean(),
            includeErrorHandling: fc.boolean(),
            includeTypes: fc.boolean(),
            includeDocstrings: fc.boolean(),
          }),
          async (options) => {
            const config: PromptConfig = {
              id: 'test-prompt',
              name: 'Test Prompt',
              description: 'A test prompt',
              prompt: 'Test {{input}}',
              model: 'gpt-4',
              temperature: 0.7,
              maxTokens: 1000,
              topP: 0.9,
              frequencyPenalty: 0.0,
              presencePenalty: 0.0,
              stopSequences: [],
              variables: [{
                name: 'input',
                type: 'string',
                description: 'Input text',
                required: true,
              }],
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            const sdk = SDKGenerator.generate({
              promptConfig: config,
              language: 'typescript',
              options,
            });

            // التحقق من وجود الميزات المطلوبة
            if (options.asyncMode) {
              expect(sdk.code).toContain('async');
              expect(sdk.code).toContain('Promise');
            }

            if (options.includeRetryLogic) {
              expect(sdk.code).toContain('withRetry');
            }

            if (options.includeErrorHandling) {
              expect(sdk.code).toContain('PromptStudioError');
              expect(sdk.code).toContain('catch');
            }

            if (options.includeTypes) {
              expect(sdk.code).toContain('interface');
              expect(sdk.code).toContain(': string');
            }

            if (options.includeDocstrings) {
              expect(sdk.code).toContain('/**');
              expect(sdk.code).toContain('* @param');
            }
          }
        ),
        { numRuns: 12, timeout: 60000 }
      );
    });
  });

  describe('الخاصية 8.3: صحة الكود (Code Validity)', () => {
    /**
     * الخاصية 8.3.1: الكود المولد صحيح نحوياً (TypeScript)
     */
    it('يجب أن يكون الكود المولد صحيح نحوياً - TypeScript', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            name: fc.string({ minLength: 1, maxLength: 20 }),
            description: fc.string({ minLength: 1, maxLength: 40 }),
            prompt: fc.string({ minLength: 1, maxLength: 80 }),
            model: fc.constantFrom('gpt-4', 'gpt-3.5-turbo'),
            temperature: fc.float({ min: 0, max: 1 }),
            maxTokens: fc.integer({ min: 50, max: 500 }),
            topP: fc.float({ min: 0.1, max: 0.9 }).map(Math.fround),
            frequencyPenalty: fc.float({ min: -1, max: 1 }),
            presencePenalty: fc.float({ min: -1, max: 1 }),
            stopSequences: fc.array(fc.string({ minLength: 1, maxLength: 3 }), { minLength: 0, maxLength: 2 }),
            variables: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 10 }),
                type: fc.constantFrom('string', 'number', 'boolean') as any,
                description: fc.string({ minLength: 1, maxLength: 20 }),
                required: fc.boolean(),
                defaultValue: fc.option(fc.string()),
              }),
              { minLength: 0, maxLength: 5 }
            ) as any,
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          async (config) => {
            const sdk = SDKGenerator.generate({
              promptConfig: config,
              language: 'typescript',
            });

            // فحوصات نحوية أساسية لـ TypeScript
            const code = sdk.code;

            // عدد الأقواس المتوازن
            const openBraces = (code.match(/\{/g) || []).length;
            const closeBraces = (code.match(/\}/g) || []).length;
            expect(openBraces).toBe(closeBraces);

            // عدد الأقواس العادية المتوازن
            const openParens = (code.match(/\(/g) || []).length;
            const closeParens = (code.match(/\)/g) || []).length;
            expect(openParens).toBe(closeParens);

            // عدد الأقواس المربعة المتوازن
            const openBrackets = (code.match(/\[/g) || []).length;
            const closeBrackets = (code.match(/\]/g) || []).length;
            expect(openBrackets).toBe(closeBrackets);

            // لا توجد قيم undefined
            expect(code).not.toContain('undefined');

            // التأكد من وجود export أو class
            expect(code).toMatch(/export|class|interface/);

            // التأكد من وجود اسم المتغيرات في الكود
            config.variables.forEach(v => {
              expect(code).toContain(v.name);
            });
          }
        ),
        { numRuns: 20, timeout: 60000 }
      );
    });

    /**
     * الخاصية 8.3.2: الكود المولد صحيح نحوياً (Python)
     */
    it('يجب أن يكون الكود المولد صحيح نحوياً - Python', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            name: fc.string({ minLength: 1, maxLength: 20 }),
            description: fc.string({ minLength: 1, maxLength: 40 }),
            prompt: fc.string({ minLength: 1, maxLength: 80 }),
            model: fc.constantFrom('gpt-4', 'gpt-3.5-turbo'),
            temperature: fc.float({ min: 0, max: 1 }),
            maxTokens: fc.integer({ min: 50, max: 500 }),
            topP: fc.float({ min: 0.1, max: 0.9 }).map(Math.fround),
            frequencyPenalty: fc.float({ min: -1, max: 1 }),
            presencePenalty: fc.float({ min: -1, max: 1 }),
            stopSequences: fc.array(fc.string({ minLength: 1, maxLength: 3 }), { minLength: 0, maxLength: 2 }),
            variables: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 10 }),
                type: fc.constantFrom('string', 'number', 'boolean') as any,
                description: fc.string({ minLength: 1, maxLength: 20 }),
                required: fc.boolean(),
                defaultValue: fc.option(fc.string()),
              }),
              { minLength: 0, maxLength: 5 }
            ) as any,
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          async (config) => {
            const sdk = SDKGenerator.generate({
              promptConfig: config,
              language: 'python',
            });

            const code = sdk.code;
            const lines = code.split('\n');

            // فحص المسافات البادئة (Python يستخدم 4 مساحات)
            lines.forEach((line, index) => {
              if (line.trim().length > 0) {
                const leadingSpaces = line.match(/^\s*/)?.[0].length || 0;
                expect(leadingSpaces % 4).toBe(0); // Python indentation rule

                // لا توجد تابات في Python
                expect(line).not.toContain('\t');
              }
            });

            // التأكد من وجود class أو function
            expect(code).toMatch(/class|def/);

            // التأكد من وجود import
            expect(code).toContain('import');

            // التأكد من وجود اسم المتغيرات في الكود
            config.variables.forEach(v => {
              expect(code).toContain(v.name);
            });

            // لا توجد قيم undefined
            expect(code).not.toContain('undefined');
          }
        ),
        { numRuns: 20, timeout: 60000 }
      );
    });
  });

  describe('الخاصية 8.4: التوافق (Compatibility)', () => {
    /**
     * الخاصية 8.4.1: توليد SDK لجميع اللغات المعتمدة
     */
    it('يجب أن يولد SDK صحيح لجميع اللغات المعتمدة', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 12 }),
            name: fc.string({ minLength: 1, maxLength: 25 }),
            description: fc.string({ minLength: 1, maxLength: 50 }),
            prompt: fc.string({ minLength: 1, maxLength: 90 }),
            model: fc.constantFrom('gpt-4', 'gpt-3.5-turbo'),
            temperature: fc.float({ min: 0, max: 1 }),
            maxTokens: fc.integer({ min: 50, max: 500 }),
            topP: fc.float({ min: 0.1, max: 0.9 }).map(Math.fround),
            frequencyPenalty: fc.float({ min: -1, max: 1 }),
            presencePenalty: fc.float({ min: -1, max: 1 }),
            stopSequences: fc.array(fc.string({ minLength: 1, maxLength: 3 }), { minLength: 0, maxLength: 2 }),
            variables: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 10 }),
                type: fc.constantFrom('string', 'number', 'boolean'),
                description: fc.string({ minLength: 1, maxLength: 20 }),
                required: fc.boolean(),
                defaultValue: fc.option(fc.string()),
              }),
              { minLength: 0, maxLength: 3 }
            ),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          async (config) => {
            const languages = ['typescript', 'python', 'javascript', 'go', 'curl'];

            for (const language of languages) {
              try {
                const sdk = SDKGenerator.generate({
                  promptConfig: config,
                  language: language as any,
                });

                // التأكد من أن SDK تم توليده بنجاح
                expect(sdk).toBeDefined();
                expect(sdk.code).toBeDefined();
                expect(sdk.code.length).toBeGreaterThan(0);
                expect(sdk.filename).toBeDefined();
                expect(sdk.filename.length).toBeGreaterThan(0);
                expect(Array.isArray(sdk.dependencies)).toBe(true);

                // التأكد من وجود اسم المتغيرات في الكود (إلا لـ curl)
                if (language !== 'curl') {
                  config.variables.forEach(v => {
                    expect(sdk.code).toContain(v.name);
                  });
                }
              } catch (error) {
                throw new Error(`Failed to generate SDK for ${language}: ${error}`);
              }
            }
          }
        ),
        { numRuns: 5, timeout: 60000 }
      );
    });
  });

  describe('الخاصية 8.5: السلامة (Safety)', () => {
    /**
     * الخاصية 8.5.1: عدم وجود كود ضار أو injection
     */
    it('يجب ألا يحتوي الكود على أنماط ضارة', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 15 }),
            name: fc.string({ minLength: 1, maxLength: 25 }),
            description: fc.string({ minLength: 1, maxLength: 40 }),
            prompt: fc.string({ minLength: 1, maxLength: 70 }),
            model: fc.constantFrom('gpt-4', 'gpt-3.5-turbo'),
            temperature: fc.float({ min: 0, max: 1 }),
            maxTokens: fc.integer({ min: 50, max: 500 }),
            topP: fc.float({ min: 0.1, max: 0.9 }).map(Math.fround),
            frequencyPenalty: fc.float({ min: -1, max: 1 }),
            presencePenalty: fc.float({ min: -1, max: 1 }),
            stopSequences: fc.array(fc.string({ minLength: 1, maxLength: 3 }), { minLength: 0, maxLength: 2 }),
            variables: fc.array(
              fc.record({
                name: fc.string({ minLength: 1, maxLength: 8 }),
                type: fc.constantFrom('string', 'number'),
                description: fc.string({ minLength: 1, maxLength: 18 }),
                required: fc.boolean(),
                defaultValue: fc.option(fc.string()),
              }),
              { minLength: 0, maxLength: 3 }
            ),
            createdAt: fc.date(),
            updatedAt: fc.date(),
          }),
          async (config) => {
            const languages = ['typescript', 'python', 'javascript'];

            for (const language of languages) {
              const sdk = SDKGenerator.generate({
                promptConfig: config,
                language: language as any,
              });

              const code = sdk.code;

              // عدم وجود أنماط تنفيذ نظام
              expect(code).not.toContain('exec(');
              expect(code).not.toContain('eval(');
              expect(code).not.toContain('__import__');
              expect(code).not.toContain('subprocess');
              expect(code).not.toContain('os.system');
              expect(code).not.toContain('child_process');

              // عدم وجود SQL injection
              expect(code).not.toContain('DROP TABLE');
              expect(code).not.toContain('DELETE FROM');
              expect(code).not.toContain('INSERT INTO');

              // عدم وجود XSS في comments
              expect(code).not.toContain('<script>');
              expect(code).not.toContain('javascript:');

              // عدم وجود path traversal
              expect(code).not.toContain('../');
              expect(code).not.toContain('..\\');
            }
          }
        ),
        { numRuns: 15, timeout: 60000 }
      );
    });

    /**
     * الخاصية 8.5.2: التعامل الآمن مع المدخلات
     */
    it('يجب أن يتعامل مع المدخلات الخاصة بأمان', async () => {
      const dangerousInputs = [
        '"; DROP TABLE users; --',
        '<script>alert("xss")</script>',
        '../../../etc/passwd',
        'eval("malicious code")',
        'require("child_process").exec("rm -rf /")',
      ];

      for (const dangerousInput of dangerousInputs) {
        const config: PromptConfig = {
          id: 'test',
          name: 'Test',
          description: 'Test prompt',
          prompt: `Process: ${dangerousInput}`,
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 100,
          topP: 0.9,
          frequencyPenalty: 0,
          presencePenalty: 0,
          stopSequences: [],
      variables: [{
        name: 'input',
        type: 'string',
        description: 'Input parameter',
        required: true,
      }] as any,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const sdk = SDKGenerator.generate({
          promptConfig: config,
          language: 'typescript',
        });

        // التأكد من أن المدخلات الخطرة لم تتم حقنها ككود قابل للتنفيذ
        expect(sdk.code).not.toContain(dangerousInput);
        expect(sdk.code).toContain(JSON.stringify(dangerousInput));
      }
    });
  });

  describe('الخاصية 8.6: الأداء (Performance)', () => {
    /**
     * الخاصية 8.6.1: توليد سريع ومتسق
     */
    it('يجب أن يكون التوليد سريعاً ومتسقاً في الوقت', async () => {
      const config: PromptConfig = {
        id: 'performance-test',
        name: 'Performance Test',
        description: 'Testing SDK generation performance',
        prompt: 'Generate a response for {{input}} with context {{context}}',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        topP: 0.9,
        frequencyPenalty: 0,
        presencePenalty: 0,
        stopSequences: [],
        variables: [
          { name: 'input', type: 'string', description: 'Input text', required: true },
          { name: 'context', type: 'string', description: 'Context', required: false },
        ] as any,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const times: number[] = [];

      // قياس وقت التوليد 10 مرات
      for (let i = 0; i < 10; i++) {
        const start = Date.now();
        SDKGenerator.generate({
          promptConfig: config,
          language: 'typescript',
        });
        const end = Date.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      // متوسط الوقت يجب أن يكون أقل من 100ms
      expect(avgTime).toBeLessThan(100);

      // أقصى وقت يجب أن يكون أقل من 200ms
      expect(maxTime).toBeLessThan(200);

      // التباين يجب أن يكون منخفضاً
      const variance = maxTime - minTime;
      expect(variance).toBeLessThan(50);
    });
  });
});

/**
 * Runtime Tests - اختبارات تشغيل الكود المولد فعلياً
 */
describe('اختبارات التشغيل (Runtime Tests)', () => {
  let testConfig: PromptConfig;

  beforeAll(() => {
    testConfig = {
      id: 'runtime-test-prompt',
      name: 'Runtime Test Prompt',
      description: 'A prompt for testing SDK runtime execution',
      prompt: 'Generate a response for {{input}} with context {{context}}',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      stopSequences: ['STOP'],
      variables: [
        {
          name: 'input',
          type: 'string',
          description: 'The main input text',
          required: true,
        },
        {
          name: 'context',
          type: 'string',
          description: 'Additional context',
          required: false,
          defaultValue: 'No context provided',
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  describe('الخاصية 8.7: تشغيل الكود (Code Execution)', () => {
    /**
     * الخاصية 8.7.1: توليد كود قابل للتشغيل (TypeScript)
     */
    it('يجب أن يولد كود TypeScript قابل للتشغيل', async () => {
      const sdk = SDKGenerator.generate({
        promptConfig: testConfig,
        language: 'typescript',
        options: {
          asyncMode: true,
          includeRetryLogic: true,
          includeErrorHandling: true,
          includeTypes: true,
          includeDocstrings: true,
        },
      });

      const result = await runtimeTester.testSDK(sdk, testConfig, {
        timeout: 15000,
        includeCompilation: true,
        includeExecution: true,
      });

      expect(result.syntaxValid).toBe(true);
      expect(result.success).toBe(true);
      expect(result.executionTime).toBeLessThan(10000);
    }, 20000);

    /**
     * الخاصية 8.7.2: توليد كود قابل للتشغيل (Python)
     */
    it('يجب أن يولد كود Python قابل للتشغيل', async () => {
      const sdk = SDKGenerator.generate({
        promptConfig: testConfig,
        language: 'python',
        options: {
          asyncMode: true,
          includeRetryLogic: true,
          includeErrorHandling: true,
          includeTypes: true,
          includeDocstrings: true,
        },
      });

      const result = await runtimeTester.testSDK(sdk, testConfig, {
        timeout: 15000,
        includeCompilation: true,
        includeExecution: true,
      });

      expect(result.syntaxValid).toBe(true);
      expect(result.success).toBe(true);
      expect(result.executionTime).toBeLessThan(10000);
    }, 20000);

    /**
     * الخاصية 8.7.3: توليد كود قابل للتشغيل (JavaScript)
     */
    it('يجب أن يولد كود JavaScript قابل للتشغيل', async () => {
      const sdk = SDKGenerator.generate({
        promptConfig: testConfig,
        language: 'javascript',
        options: {
          asyncMode: true,
          includeRetryLogic: true,
          includeErrorHandling: true,
        },
      });

      const result = await runtimeTester.testSDK(sdk, testConfig, {
        timeout: 15000,
        includeExecution: true,
      });

      expect(result.syntaxValid).toBe(true);
      expect(result.success).toBe(true);
      expect(result.executionTime).toBeLessThan(10000);
    }, 20000);
  });

  describe('الخاصية 8.8: التحقق من الوظائف (Functionality Validation)', () => {
    /**
     * الخاصية 8.8.1: التحقق من وجود جميع الوظائف المطلوبة
     */
    it('يجب أن يحتوي الكود على جميع الوظائف المطلوبة', async () => {
      const languages = ['typescript', 'python', 'javascript'];

      for (const language of languages) {
        const sdk = SDKGenerator.generate({
          promptConfig: testConfig,
          language: language as any,
          options: {
            asyncMode: true,
            includeRetryLogic: true,
            includeErrorHandling: true,
            includeTypes: true,
          },
        });

        const result = await runtimeTester.testSDK(sdk, testConfig);

        // التحقق من أن الكود يحتوي على العناصر الأساسية
        expect(sdk.code).toMatch(language === 'python' ? /def execute/ : /execute\(/);
        expect(sdk.code).toMatch(language === 'python' ? /class.*Client/ : /class.*Client/);

        // التحقق من وجود معالجة الأخطاء
        if (language !== 'curl') {
          expect(result.syntaxValid).toBe(true);
        }
      }
    });

    /**
     * الخاصية 8.8.2: التحقق من صحة التبعيات
     */
    it('يجب أن تكون التبعيات صحيحة وقابلة للتثبيت', async () => {
      const sdk = SDKGenerator.generate({
        promptConfig: testConfig,
        language: 'typescript',
        options: {
          includeRetryLogic: true,
        },
      });

      // التحقق من وجود التبعيات المطلوبة
      expect(sdk.dependencies).toContain('axios');
      expect(sdk.dependencies).toContain('axios-retry');

      // التحقق من عدم وجود تبعيات مكررة
      const uniqueDeps = new Set(sdk.dependencies);
      expect(uniqueDeps.size).toBe(sdk.dependencies.length);
    });

    /**
     * الخاصية 8.8.3: التحقق من صحة أسماء الملفات
     */
    it('يجب أن تكون أسماء الملفات صحيحة ومناسبة', async () => {
      const languages = ['typescript', 'python', 'javascript', 'go'];

      for (const language of languages) {
        const sdk = SDKGenerator.generate({
          promptConfig: testConfig,
          language: language as any,
        });

        expect(sdk.filename).toBeDefined();
        expect(sdk.filename.length).toBeGreaterThan(3);
        expect(sdk.filename).toMatch(/\.(ts|js|py|go)$/);
      }
    });
  });

  describe('الخاصية 8.9: اختبار شامل لجميع اللغات', () => {
    /**
     * الخاصية 8.9.1: اختبار جميع اللغات المدعومة
     */
    it('يجب أن يعمل التوليد لجميع اللغات المدعومة', async () => {
      const results = await testAllSDKs(testConfig, {
        timeout: 20000,
        includeCompilation: true,
        includeExecution: true,
      });

      // التحقق من وجود نتائج لجميع اللغات
      expect(results).toHaveProperty('typescript');
      expect(results).toHaveProperty('python');
      expect(results).toHaveProperty('javascript');
      expect(results).toHaveProperty('go');
      expect(results).toHaveProperty('curl');

      // التحقق من نجاح اللغات الرئيسية
      const mainLanguages = ['typescript', 'python', 'javascript'];
      mainLanguages.forEach(lang => {
        expect(results[lang].success).toBe(true);
        expect(results[lang].syntaxValid).toBe(true);
        expect(results[lang].executionTime).toBeLessThan(15000);
      });

    }, 120000); // 2 minutes timeout for all languages
  });

  describe('الخاصية 8.10: اختبار الحدود (Edge Cases)', () => {
    /**
     * الخاصية 8.10.1: التعامل مع prompts بدون متغيرات
     */
    it('يجب أن يتعامل مع prompts بدون متغيرات', async () => {
      const configNoVars: PromptConfig = {
        ...testConfig,
        variables: [],
        prompt: 'Generate a simple response',
      };

      const sdk = SDKGenerator.generate({
        promptConfig: configNoVars,
        language: 'typescript',
      });

      const result = await runtimeTester.testSDK(sdk, configNoVars);

      expect(result.syntaxValid).toBe(true);
      expect(result.success).toBe(true);
    });

    /**
     * الخاصية 8.10.2: التعامل مع prompts بمتغيرات كثيرة
     */
    it('يجب أن يتعامل مع prompts بمتغيرات كثيرة', async () => {
      const configManyVars: PromptConfig = {
        ...testConfig,
        variables: Array.from({ length: 20 }, (_, i) => ({
          name: `var${i}`,
          type: 'string' as const,
          description: `Variable ${i}`,
          required: i < 10,
          defaultValue: `default${i}`,
        })) as any,
      };

      const sdk = SDKGenerator.generate({
        promptConfig: configManyVars,
        language: 'python',
      });

      const result = await runtimeTester.testSDK(sdk, configManyVars);

      expect(result.syntaxValid).toBe(true);
      expect(result.success).toBe(true);

      // التحقق من وجود جميع المتغيرات في الكود
      configManyVars.variables.forEach(v => {
        expect(sdk.code).toContain(v.name);
      });
    });

    /**
     * الخاصية 8.10.3: التعامل مع أسماء متغيرات خاصة
     */
    it('يجب أن يتعامل مع أسماء متغيرات خاصة', async () => {
      const configSpecialVars: PromptConfig = {
        ...testConfig,
        variables: [
          { name: 'input_data', type: 'string', description: 'Input', required: true },
          { name: 'output_format', type: 'string', description: 'Format', required: false },
          { name: 'max_length', type: 'number', description: 'Max length', required: false },
        ] as any,
      };

      const sdk = SDKGenerator.generate({
        promptConfig: configSpecialVars,
        language: 'typescript',
      });

      const result = await runtimeTester.testSDK(sdk, configSpecialVars);

      expect(result.syntaxValid).toBe(true);
      expect(result.success).toBe(true);

      // التحقق من وجود جميع المتغيرات الخاصة
      configSpecialVars.variables.forEach(v => {
        expect(sdk.code).toContain(v.name);
      });
    });
  });

  describe('الخاصية 8.11: اختبار الأداء (Performance)', () => {
    /**
     * الخاصية 8.11.1: قياس وقت التوليد
     */
    it('يجب أن يكون التوليد سريعاً', async () => {
      const times: number[] = [];

      // قياس وقت التوليد 10 مرات
      for (let i = 0; i < 10; i++) {
        const start = Date.now();

        SDKGenerator.generate({
          promptConfig: testConfig,
          language: 'typescript',
          options: {
            asyncMode: true,
            includeRetryLogic: true,
            includeErrorHandling: true,
            includeTypes: true,
            includeDocstrings: true,
          },
        });

        const end = Date.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      // متوسط الوقت يجب أن يكون أقل من 50ms
      expect(avgTime).toBeLessThan(50);

      // الحد الأقصى يجب أن يكون أقل من 100ms
      expect(maxTime).toBeLessThan(100);
    });

    /**
     * الخاصية 8.11.2: قياس وقت التشغيل
     */
    it('يجب أن يكون التشغيل سريعاً', async () => {
      const sdk = SDKGenerator.generate({
        promptConfig: testConfig,
        language: 'typescript',
      });

      const times: number[] = [];

      // قياس وقت التشغيل 5 مرات
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        await runtimeTester.testSDK(sdk, testConfig, {
          timeout: 5000,
          includeExecution: true,
        });
        const end = Date.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;

      // متوسط وقت التشغيل يجب أن يكون أقل من 2 ثانية
      expect(avgTime).toBeLessThan(2000);
    });
  });
});
