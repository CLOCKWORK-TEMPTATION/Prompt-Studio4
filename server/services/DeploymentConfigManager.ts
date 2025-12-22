/**
 * مدير إعدادات النشر السحابي
 * يدير ملفات التكوين والإعدادات لكل منصة نشر
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { DeploymentConfig } from './CloudDeploymentService';

export interface PlatformTemplate {
  name: string;
  displayName: string;
  description: string;
  defaultConfig: Partial<DeploymentConfig>;
  requiredEnvVars: string[];
  optionalEnvVars: string[];
  supportedRegions: string[];
  configFiles: string[];
}

export class DeploymentConfigManager {
  private logger = console;
  private templatesCache: Map<string, PlatformTemplate> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  /**
   * تهيئة قوالب المنصات
   */
  private initializeTemplates(): void {
    // قالب Vercel
    this.templatesCache.set('vercel', {
      name: 'vercel',
      displayName: 'Vercel Edge Functions',
      description: 'نشر سريع على شبكة Vercel العالمية مع Edge Functions',
      defaultConfig: {
        platform: 'vercel',
        region: 'iad1',
        environment: 'production',
        buildCommand: 'npm run build'
      },
      requiredEnvVars: ['GROQ_API_KEY'],
      optionalEnvVars: ['OPENAI_API_KEY', 'VERCEL_TOKEN'],
      supportedRegions: ['iad1', 'sfo1', 'fra1', 'hnd1', 'sin1'],
      configFiles: ['vercel.json', 'package.json', '.env.example']
    });

    // قالب Cloudflare
    this.templatesCache.set('cloudflare', {
      name: 'cloudflare',
      displayName: 'Cloudflare Workers',
      description: 'نشر على شبكة Cloudflare العالمية مع Workers',
      defaultConfig: {
        platform: 'cloudflare',
        region: 'auto',
        environment: 'production'
      },
      requiredEnvVars: ['GROQ_API_KEY'],
      optionalEnvVars: ['OPENAI_API_KEY', 'CLOUDFLARE_API_TOKEN'],
      supportedRegions: ['auto'],
      configFiles: ['wrangler.toml', 'package.json', '.dev.vars']
    });

    // قالب AWS
    this.templatesCache.set('aws', {
      name: 'aws',
      displayName: 'AWS Lambda',
      description: 'نشر على AWS Lambda مع API Gateway',
      defaultConfig: {
        platform: 'aws',
        region: 'us-east-1',
        environment: 'production'
      },
      requiredEnvVars: ['GROQ_API_KEY', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
      optionalEnvVars: ['OPENAI_API_KEY', 'AWS_REGION'],
      supportedRegions: [
        'us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1',
        'ap-southeast-1', 'ap-northeast-1'
      ],
      configFiles: ['serverless.yml', 'package.json', 'cloudformation.yml']
    });

    // قالب Google Cloud
    this.templatesCache.set('gcp', {
      name: 'gcp',
      displayName: 'Google Cloud Functions',
      description: 'نشر على Google Cloud Functions',
      defaultConfig: {
        platform: 'gcp',
        region: 'us-central1',
        environment: 'production'
      },
      requiredEnvVars: ['GROQ_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS'],
      optionalEnvVars: ['OPENAI_API_KEY', 'GCP_PROJECT_ID'],
      supportedRegions: [
        'us-central1', 'us-east1', 'europe-west1', 'asia-east1',
        'asia-northeast1', 'australia-southeast1'
      ],
      configFiles: ['cloudbuild.yaml', 'package.json', '.gcloudignore']
    });
  }

  /**
   * الحصول على قالب منصة
   */
  getPlatformTemplate(platform: string): PlatformTemplate | null {
    return this.templatesCache.get(platform) || null;
  }

  /**
   * الحصول على جميع القوالب المتاحة
   */
  getAllPlatformTemplates(): PlatformTemplate[] {
    return Array.from(this.templatesCache.values());
  }

  /**
   * التحقق من صحة إعدادات النشر
   */
  validateDeploymentConfig(config: DeploymentConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    const template = this.getPlatformTemplate(config.platform);
    if (!template) {
      errors.push(`المنصة غير مدعومة: ${config.platform}`);
      return { isValid: false, errors, warnings };
    }

    // التحقق من الحقول المطلوبة
    if (!config.projectName || config.projectName.trim() === '') {
      errors.push('اسم المشروع مطلوب');
    }

    if (!config.region || config.region.trim() === '') {
      errors.push('المنطقة مطلوبة');
    } else if (!template.supportedRegions.includes(config.region)) {
      warnings.push(`المنطقة ${config.region} قد لا تكون مدعومة لمنصة ${config.platform}`);
    }

    // التحقق من متغيرات البيئة المطلوبة
    const envVars = config.envVars || {};
    template.requiredEnvVars.forEach(envVar => {
      if (!envVars[envVar]) {
        errors.push(`متغير البيئة المطلوب غير موجود: ${envVar}`);
      }
    });

    // التحقق من اسم المشروع
    if (config.projectName && !/^[a-z0-9-]+$/.test(config.projectName)) {
      errors.push('اسم المشروع يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * إنشاء إعدادات افتراضية لمنصة
   */
  createDefaultConfig(
    platform: string,
    projectName: string,
    overrides: Partial<DeploymentConfig> = {}
  ): DeploymentConfig | null {
    const template = this.getPlatformTemplate(platform);
    if (!template) {
      return null;
    }

    return {
      ...template.defaultConfig,
      projectName,
      ...overrides
    } as DeploymentConfig;
  }

  /**
   * حفظ إعدادات النشر في ملف
   */
  async saveDeploymentConfig(
    config: DeploymentConfig,
    filePath: string
  ): Promise<void> {
    try {
      const configData = {
        ...config,
        createdAt: new Date().toISOString(),
        version: '1.0.0'
      };

      await fs.writeFile(
        filePath,
        JSON.stringify(configData, null, 2),
        'utf-8'
      );

      this.logger.info(`تم حفظ إعدادات النشر في: ${filePath}`);
    } catch (error) {
      this.logger.error('خطأ في حفظ إعدادات النشر:', error);
      throw error;
    }
  }

  /**
   * تحميل إعدادات النشر من ملف
   */
  async loadDeploymentConfig(filePath: string): Promise<DeploymentConfig> {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const configData = JSON.parse(fileContent);

      // إزالة الحقول الإضافية
      const { createdAt, version, ...config } = configData;

      return config as DeploymentConfig;
    } catch (error) {
      this.logger.error('خطأ في تحميل إعدادات النشر:', error);
      throw error;
    }
  }

  /**
   * إنشاء مجلد إعدادات النشر
   */
  async createDeploymentDirectory(projectName: string): Promise<string> {
    const deploymentDir = path.join(process.cwd(), 'deployments', projectName);
    
    try {
      await fs.mkdir(deploymentDir, { recursive: true });
      this.logger.info(`تم إنشاء مجلد النشر: ${deploymentDir}`);
      return deploymentDir;
    } catch (error) {
      this.logger.error('خطأ في إنشاء مجلد النشر:', error);
      throw error;
    }
  }

  /**
   * إنشاء ملف البيئة المثال
   */
  async generateEnvExample(
    platform: string,
    outputPath: string
  ): Promise<void> {
    const template = this.getPlatformTemplate(platform);
    if (!template) {
      throw new Error(`المنصة غير مدعومة: ${platform}`);
    }

    const envLines = [
      `# متغيرات البيئة لمنصة ${template.displayName}`,
      `# تم التوليد تلقائياً في: ${new Date().toISOString()}`,
      '',
      '# متغيرات مطلوبة',
      ...template.requiredEnvVars.map(envVar => `${envVar}=your_${envVar.toLowerCase()}_here`),
      '',
      '# متغيرات اختيارية',
      ...template.optionalEnvVars.map(envVar => `# ${envVar}=your_${envVar.toLowerCase()}_here`)
    ];

    await fs.writeFile(outputPath, envLines.join('\n'), 'utf-8');
    this.logger.info(`تم إنشاء ملف البيئة المثال: ${outputPath}`);
  }

  /**
   * الحصول على إحصائيات النشر
   */
  async getDeploymentStats(): Promise<{
    totalDeployments: number;
    platformStats: Record<string, number>;
    recentDeployments: number;
  }> {
    try {
      const deploymentsDir = path.join(process.cwd(), 'deployments');
      
      // التحقق من وجود مجلد النشرات
      try {
        await fs.access(deploymentsDir);
      } catch {
        return {
          totalDeployments: 0,
          platformStats: {},
          recentDeployments: 0
        };
      }

      const deploymentFolders = await fs.readdir(deploymentsDir);
      const platformStats: Record<string, number> = {};
      let recentDeployments = 0;
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

      for (const folder of deploymentFolders) {
        const folderPath = path.join(deploymentsDir, folder);
        const configPath = path.join(folderPath, 'deployment.json');

        try {
          const config = await this.loadDeploymentConfig(configPath);
          
          // إحصائيات المنصات
          platformStats[config.platform] = (platformStats[config.platform] || 0) + 1;

          // النشرات الحديثة
          const folderStat = await fs.stat(folderPath);
          if (folderStat.mtime.getTime() > oneWeekAgo) {
            recentDeployments++;
          }
        } catch {
          // تجاهل الأخطاء في قراءة الملفات
        }
      }

      return {
        totalDeployments: deploymentFolders.length,
        platformStats,
        recentDeployments
      };
    } catch (error) {
      this.logger.error('خطأ في الحصول على إحصائيات النشر:', error);
      return {
        totalDeployments: 0,
        platformStats: {},
        recentDeployments: 0
      };
    }
  }
}

export const deploymentConfigManager = new DeploymentConfigManager();