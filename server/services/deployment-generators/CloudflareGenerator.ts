/**
 * مولد Cloudflare Workers للنشر السحابي
 * يقوم بإنشاء ملفات النشر المطلوبة لمنصة Cloudflare Workers
 */

import { DeploymentConfig, DeploymentFiles } from '../CloudDeploymentService';

export interface CloudflareConfig extends DeploymentConfig {
  accountId?: string;
  compatibilityDate?: string;
  kv?: Array<{ binding: string; id: string }>;
  durable_objects?: Array<{ name: string; class_name: string }>;
}

export class CloudflareGenerator {
  private logger = console;

  /**
   * توليد ملفات النشر لـ Cloudflare Workers
   */
  async generateDeploymentFiles(
    promptId: string,
    config: CloudflareConfig
  ): Promise<DeploymentFiles> {
    this.logger.info(`توليد ملفات Cloudflare Workers للموجه: ${promptId}`);

    const files: DeploymentFiles = {};

    // إنشاء wrangler.toml
    files['wrangler.toml'] = this.generateWranglerConfig(config);

    // إنشاء Worker Script
    files['src/index.js'] = this.generateWorkerScript(promptId, config);

    // إنشاء package.json
    files['package.json'] = this.generatePackageJson(config);

    // إنشاء README
    files['README.md'] = this.generateReadme(config);

    // إنشاء ملف البيئة
    files['.dev.vars'] = this.generateDevVars(config);

    return files;
  }

  /**
   * توليد ملف wrangler.toml
   */
  private generateWranglerConfig(config: CloudflareConfig): string {
    const wranglerConfig = [
      `name = "${config.projectName}"`,
      `main = "src/index.js"`,
      `compatibility_date = "${config.compatibilityDate || '2024-01-01'}"`,
      '',
      `[env.${config.environment}]`,
    ];

    // إضافة متغيرات البيئة
    Object.entries(config.envVars || {}).forEach(([key, value]) => {
      wranglerConfig.push(`${key} = "${value}"`);
    });

    // إضافة KV namespaces إن وجدت
    if (config.kv && config.kv.length > 0) {
      wranglerConfig.push('');
      wranglerConfig.push('[[kv_namespaces]]');
      config.kv.forEach(kv => {
        wranglerConfig.push(`binding = "${kv.binding}"`);
        wranglerConfig.push(`id = "${kv.id}"`);
      });
    }

    return wranglerConfig.join('\n');
  }

  /**
   * توليد Worker Script
   */
  private generateWorkerScript(promptId: string, config: CloudflareConfig): string {
    return `/**
 * Cloudflare Worker للموجه: ${promptId}
 * تم التوليد تلقائياً في: ${new Date().toISOString()}
 */

/**
 * معالج الطلبات الرئيسي
 */
export default {
  async fetch(request, env, ctx) {
    // معالجة CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // التحقق من الطريقة
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    try {
      const body = await request.json();
      const { variables, config: modelConfig } = body;

      // تنفيذ الموجه
      const result = await executePrompt(
        '${promptId}',
        variables,
        modelConfig,
        env
      );

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60'
        }
      });

    } catch (error) {
      console.error('خطأ في تنفيذ الموجه:', error);
      
      return new Response(JSON.stringify({
        error: 'فشل في تنفيذ الموجه',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};

/**
 * تنفيذ الموجه باستخدام LLM API
 */
async function executePrompt(promptId, variables, config, env) {
  const apiKey = env.GROQ_API_KEY || env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('مفتاح API غير متوفر');
  }

  // استبدال المتغيرات في الموجه
  const processedPrompt = substituteVariables(
    getPromptTemplate(promptId),
    variables
  );

  // استدعاء LLM API
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${apiKey}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'user', content: processedPrompt }
      ],
      temperature: config.temperature || 0.7,
      max_tokens: config.maxTokens || 1000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(\`خطأ في API: \${response.status} - \${errorText}\`);
  }

  const data = await response.json();
  
  return {
    output: data.choices[0].message.content,
    usage: data.usage,
    model: data.model,
    cached: false
  };
}

/**
 * الحصول على قالب الموجه
 */
function getPromptTemplate(promptId) {
  // هنا يمكن تحميل الموجه من KV storage أو ملف
  return \`أنت مساعد ذكي. الرجاء الإجابة على السؤال التالي: {input}\`;
}

/**
 * استبدال المتغيرات في النص
 */
function substituteVariables(text, variables) {
  let result = text;
  for (const [key, value] of Object.entries(variables || {})) {
    const regex = new RegExp(\`\\\\{\${key}\\\\}\`, 'g');
    result = result.replace(regex, String(value));
  }
  return result;
}`;