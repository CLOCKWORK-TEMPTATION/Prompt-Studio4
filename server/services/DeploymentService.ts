import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

// Promisify exec for async/await usage
const execAsync = promisify(exec);

export interface DeploymentConfig {
    provider: 'vercel' | 'cloudflare' | 'aws' | 'gcp';
    environment: 'development' | 'staging' | 'production';
    region?: string;
    domain?: string;
    tenantId?: string;
    config: Record<string, unknown>;
}

export interface DeploymentResult {
    success: boolean;
    deploymentId?: string;
    url?: string;
    logs?: string[];
    error?: string;
}

export class DeploymentService {
    private templatesPath: string;
    private allowedProviders = ['vercel', 'cloudflare', 'aws', 'gcp'];

    constructor(templatesPath: string = './deployment-templates') {
        // تحويل المسار إلى مسار مطلق آمن
        this.templatesPath = path.resolve(templatesPath);
    }

    /**
     * حماية من Path Traversal - التأكد من أن المسار آمن ولا يخرج من المجلد المسموح
     */
    private validatePath(inputPath: string, basePath: string): string {
        // إزالة أي محارف خطيرة
        const sanitizedInput = inputPath.replace(/[<>:"|?*]/g, '').replace(/\.\./g, '');
        
        // تحويل المسارات إلى مسارات مطلقة
        const resolvedBase = path.resolve(basePath);
        const resolvedInput = path.resolve(basePath, sanitizedInput);
        
        // التأكد من أن المسار المطلوب داخل المجلد الأساسي
        if (!resolvedInput.startsWith(resolvedBase + path.sep) && resolvedInput !== resolvedBase) {
            throw new Error(`Path traversal detected: ${inputPath}`);
        }
        
        return resolvedInput;
    }

    /**
     * التحقق من صحة اسم المقدم
     */
    private validateProvider(provider: string): string {
        if (!this.allowedProviders.includes(provider)) {
            throw new Error(`Invalid provider: ${provider}`);
        }
        return provider;
    }

    /**
     * إنشاء مسار آمن للنشر
     */
    private createSafeDeploymentPath(provider: string): string {
        const validProvider = this.validateProvider(provider);
        const timestamp = Date.now();
        const deploymentName = `deployment-${timestamp}`;
        
        // إنشاء مسار آمن
        const providerPath = this.validatePath(validProvider, this.templatesPath);
        return this.validatePath(deploymentName, providerPath);
    }

    /**
     * كتابة ملف بشكل آمن
     */
    private async writeFileSecurely(basePath: string, fileName: string, content: string): Promise<void> {
        const safePath = this.validatePath(fileName, basePath);
        await fs.writeFile(safePath, content, { encoding: 'utf8' });
    }

    /**
     * حذف مجلد بشكل آمن
     */
    private async safeRemoveDirectory(dirPath: string): Promise<void> {
        // التأكد من أن المسار داخل مجلد templates
        if (!dirPath.startsWith(this.templatesPath)) {
            throw new Error('Cannot remove directory outside templates path');
        }
        
        try {
            await fs.rm(dirPath, { recursive: true, force: true });
        } catch (error) {
            console.error('Safe directory removal failed:', error);
        }
    }

    /**
     * Deploy application to specified provider
     */
    async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
        try {
            // التحقق من صحة المقدم
            this.validateProvider(config.provider);

            switch (config.provider) {
                case 'vercel':
                    return await this.deployToVercel(config);
                case 'cloudflare':
                    return await this.deployToCloudflare(config);
                case 'aws':
                    return await this.deployToAWS(config);
                case 'gcp':
                    return await this.deployToGCP(config);
                default:
                    throw new Error(`Unsupported provider: ${config.provider}`);
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown deployment error'
            };
        }
    }

    /**
     * Deploy to Vercel
     */
    private async deployToVercel(config: DeploymentConfig): Promise<DeploymentResult> {
        const deploymentPath = this.createSafeDeploymentPath('vercel');

        try {
            // Create deployment directory
            await fs.mkdir(deploymentPath, { recursive: true });

            // Generate vercel.json
            const vercelConfig = {
                version: 2,
                builds: [
                    {
                        src: 'dist/**',
                        use: '@vercel/static'
                    }
                ],
                routes: [
                    {
                        src: '/api/(.*)',
                        dest: '/api/$1'
                    },
                    {
                        src: '/(.*)',
                        dest: '/index.html'
                    }
                ]
            };

            // Write vercel.json securely
            await this.writeFileSecurely(
                deploymentPath,
                'vercel.json',
                JSON.stringify(vercelConfig, null, 2)
            );

            // Copy application files
            await this.copyAppFiles(deploymentPath);

            // Deploy using Vercel CLI (sanitized command)
            const sanitizedPath = deploymentPath.replace(/[;&|`$()]/g, '');
            const { stdout, stderr } = await execAsync(
                `cd "${sanitizedPath}" && npx vercel --prod --yes`,
                { 
                    env: { 
                        ...process.env, 
                        VERCEL_TOKEN: config.config.vercelToken as string 
                    },
                    timeout: 300000 // 5 minutes timeout
                }
            );

            const logs = this.parseLogs(stdout + stderr);
            const deploymentUrl = this.extractDeploymentUrl(logs);

            return {
                success: true,
                deploymentId: `vercel-${Date.now()}`,
                url: deploymentUrl,
                logs
            };

        } catch (error) {
            // Cleanup on failure
            try {
                await this.safeRemoveDirectory(deploymentPath);
            } catch (cleanupError) {
                console.error('Cleanup failed:', cleanupError);
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Vercel deployment failed'
            };
        }
    }

    /**
     * Deploy to Cloudflare Workers
     */
    private async deployToCloudflare(config: DeploymentConfig): Promise<DeploymentResult> {
        const deploymentPath = this.createSafeDeploymentPath('cloudflare');

        try {
            await fs.mkdir(deploymentPath, { recursive: true });

            // Generate wrangler.toml
            const wranglerConfig = `
name = "promptstudio-${config.environment}"
main = "dist/worker.js"
compatibility_date = "2023-05-18"

[env.${config.environment}]
vars = { ENVIRONMENT = "${config.environment}" }
`;

            await this.writeFileSecurely(deploymentPath, 'wrangler.toml', wranglerConfig);

            // Copy application files
            await this.copyAppFiles(deploymentPath);

            // Deploy using Wrangler CLI
            const sanitizedPath = deploymentPath.replace(/[;&|`$()]/g, '');
            const { stdout, stderr } = await execAsync(
                `cd "${sanitizedPath}" && npx wrangler publish`,
                { 
                    env: { 
                        ...process.env, 
                        CLOUDFLARE_API_TOKEN: config.config.cloudflareToken as string 
                    },
                    timeout: 300000
                }
            );

            const logs = this.parseLogs(stdout + stderr);

            return {
                success: true,
                deploymentId: `cloudflare-${Date.now()}`,
                url: `https://promptstudio-${config.environment}.workers.dev`,
                logs
            };

        } catch (error) {
            try {
                await this.safeRemoveDirectory(deploymentPath);
            } catch (cleanupError) {
                console.error('Cleanup failed:', cleanupError);
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : 'Cloudflare deployment failed'
            };
        }
    }

    /**
     * Deploy to AWS Lambda
     */
    private async deployToAWS(config: DeploymentConfig): Promise<DeploymentResult> {
        const deploymentPath = this.createSafeDeploymentPath('aws');

        try {
            await fs.mkdir(deploymentPath, { recursive: true });

            // Generate serverless.yml
            const serverlessConfig = `
service: promptstudio-${config.environment}

provider:
  name: aws
  runtime: nodejs18.x
  region: ${config.region || 'us-east-1'}
  environment:
    ENVIRONMENT: ${config.environment}

functions:
  app:
    handler: dist/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
      - http:
          path: /
          method: ANY
          cors: true
`;

            await this.writeFileSecurely(deploymentPath, 'serverless.yml', serverlessConfig);

            // Copy application files
            await this.copyAppFiles(deploymentPath);

            // Deploy using Serverless Framework
            const sanitizedPath = deploymentPath.replace(/[;&|`$()]/g, '');
            const { stdout, stderr } = await execAsync(
                `cd "${sanitizedPath}" && npx serverless deploy`,
                { 
                    env: { 
                        ...process.env, 
                        AWS_ACCESS_KEY_ID: config.config.awsAccessKeyId as string,
                        AWS_SECRET_ACCESS_KEY: config.config.awsSecretAccessKey as string
                    },
                    timeout: 600000 // 10 minutes timeout
                }
            );

            const logs = this.parseLogs(stdout + stderr);
            const deploymentUrl = this.extractDeploymentUrl(logs);

            return {
                success: true,
                deploymentId: `aws-${Date.now()}`,
                url: deploymentUrl,
                logs
            };

        } catch (error) {
            try {
                await this.safeRemoveDirectory(deploymentPath);
            } catch (cleanupError) {
                console.error('Cleanup failed:', cleanupError);
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : 'AWS deployment failed'
            };
        }
    }

    /**
     * Deploy to Google Cloud Platform
     */
    private async deployToGCP(config: DeploymentConfig): Promise<DeploymentResult> {
        const deploymentPath = this.createSafeDeploymentPath('gcp');

        try {
            await fs.mkdir(deploymentPath, { recursive: true });

            // Generate app.yaml
            const appYaml = `
runtime: nodejs18
service: promptstudio-${config.environment}

env_variables:
  ENVIRONMENT: ${config.environment}

automatic_scaling:
  min_instances: 0
  max_instances: 10
`;

            await this.writeFileSecurely(deploymentPath, 'app.yaml', appYaml);

            // Copy application files
            await this.copyAppFiles(deploymentPath);

            // Deploy using gcloud CLI
            const sanitizedPath = deploymentPath.replace(/[;&|`$()]/g, '');
            const { stdout, stderr } = await execAsync(
                `cd "${sanitizedPath}" && gcloud app deploy --quiet`,
                { 
                    env: { 
                        ...process.env, 
                        GOOGLE_APPLICATION_CREDENTIALS: config.config.gcpCredentials as string
                    },
                    timeout: 600000
                }
            );

            const logs = this.parseLogs(stdout + stderr);
            const deploymentUrl = this.extractDeploymentUrl(logs);

            return {
                success: true,
                deploymentId: `gcp-${Date.now()}`,
                url: deploymentUrl,
                logs
            };

        } catch (error) {
            try {
                await this.safeRemoveDirectory(deploymentPath);
            } catch (cleanupError) {
                console.error('Cleanup failed:', cleanupError);
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : 'GCP deployment failed'
            };
        }
    }

    /**
     * Copy application files to deployment directory
     */
    private async copyAppFiles(deploymentPath: string): Promise<void> {
        try {
            // تحديد مجلد المصدر الآمن
            const sourceDir = path.resolve('./');
            
            // نسخ الملفات الأساسية فقط - تجنب نسخ ملفات النظام
            const filesToCopy = [
                'package.json',
                'package-lock.json',
                'dist/',
                'public/',
                '.env.example'
            ];

            for (const file of filesToCopy) {
                const sourcePath = this.validatePath(file, sourceDir);
                const destPath = this.validatePath(file, deploymentPath);
                
                try {
                    const stats = await fs.stat(sourcePath);
                    if (stats.isDirectory()) {
                        await this.copyDirectory(sourcePath, destPath);
                    } else {
                        await fs.copyFile(sourcePath, destPath);
                    }
                } catch (error) {
                    // تجاهل الملفات غير الموجودة
                    console.warn(`File not found, skipping: ${file}`);
                }
            }
        } catch (error) {
            throw new Error(`Failed to copy application files: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * نسخ مجلد بشكل آمن
     */
    private async copyDirectory(source: string, destination: string): Promise<void> {
        await fs.mkdir(destination, { recursive: true });
        const entries = await fs.readdir(source, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = this.validatePath(entry.name, source);
            const destPath = this.validatePath(entry.name, destination);

            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    }

    /**
     * Parse deployment logs
     */
    private parseLogs(output: string): string[] {
        return output
            .split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => line.trim());
    }

    /**
     * Extract deployment URL from logs
     */
    private extractDeploymentUrl(logs: string[]): string | undefined {
        for (const log of logs) {
            // البحث عن URLs في السجلات
            const urlMatch = log.match(/https?:\/\/[^\s]+/);
            if (urlMatch) {
                return urlMatch[0];
            }
        }
        return undefined;
    }

    /**
     * Generate Docker Compose configuration
     */
    async generateDockerCompose(config: DeploymentConfig): Promise<string> {
        const dbPassword = (config.config.dbPassword as string) || 'secure_password_change_me';
        
        return `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=${config.environment}
      - DATABASE_URL=postgresql://postgres:${dbPassword}@db:5432/promptstudio
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: promptstudio
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${dbPassword}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
`;
    }

    /**
     * Generate environment variables template
     */
    generateEnvTemplate(): string {
        return `# Environment Configuration
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/promptstudio

# API Keys
GROQ_API_KEY=your_groq_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Redis
REDIS_URL=redis://localhost:6379

# Security
SESSION_SECRET=your_session_secret_change_me_in_production
JWT_SECRET=your_jwt_secret_change_me_in_production

# Deployment Tokens (uncomment as needed)
# VERCEL_TOKEN=your_vercel_token
# CLOUDFLARE_API_TOKEN=your_cloudflare_token
# AWS_ACCESS_KEY_ID=your_aws_access_key
# AWS_SECRET_ACCESS_KEY=your_aws_secret_key
# GOOGLE_APPLICATION_CREDENTIALS=/path/to/gcp-credentials.json
`;
    }
}

export const deploymentService = new DeploymentService();