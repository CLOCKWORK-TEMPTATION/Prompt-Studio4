/**
 * مولد Vercel Edge Functions للنشر السحابي
 * يقوم بإنشاء ملفات النشر المطلوبة لمنصة Vercel
 */

import { DeploymentConfig, DeploymentFiles } from '../CloudDeploymentService';

export interface VercelConfig extends DeploymentConfig {
  runtime: 'nodejs18.x' | 'nodejs20.x' | 'edge';
  regions: string[];
  functions?: Record<string, {
    runtime?: string;
    memory?: number;
    maxDuration?: number;
  }>;
}

export class VercelGenerator {
  private logger = console;

  /**
   * توليد ملفات النشر لـ Vercel
   */
  async generateDeploymentFiles(
    promptId: string,
    config: VercelConfig
  ): Promise<DeploymentFiles> {
    this.logger.info(`توليد ملفات Vercel للموجه: ${promptId}`);

    const files: DeploymentFiles = {};

    // إنشاء vercel.json
    files['vercel.json'] = this.generateVercelConfig(config);

    // إنشاء Edge Function أو API Route
    if (config.runtime === 'edge') {
      files['api/execute.js'] = this.generateEdgeFunction(promptId, config);
    } else {
      files['api/execute.js'] = this.generateAPIRoute(promptId, config);
    }

    // إنشاء package.json
    files['package.json'] = this.generatePackageJson(config);

    // إنشاء README
    files['README.md'] = this.generateReadme(config);

    // إنشاء ملف البيئة
    files['.env.example'] = this.generateEnvExample(config);

    return files;
  }

  /**
   * توليد ملف vercel.json
   */
  private generateVercelConfig(config: VercelConfig): string {
    const vercelConfig = {
      name: config.projectName,
      version: 2,
      regions: config.regions,
      env: this.formatEnvVars(config.envVars || {}),
      functions: {
        'api/execute.js': {
          runtime: config.runtime,
          ...(config.functions?.['api/execute.js'] || {})
        }
      },
      headers: [
        {
          source: '/api/(.*)',
          headers: [
            {
              key: 'Access-Control-Allow-Origin',
              value: '*'
            },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET, POST, PUT, DELETE, OPTIONS'
            },
            {
              key: 'Access-Control-Allow-Headers',
              value: 'Content-Type, Authorization'
            }
          ]
        }
      ]
    };

    return JSON.stringify(vercelConfig, null, 2);
  }

  /**
   * توليد Edge Function
   */
  private generateEdgeFunction(promptId: string, config: VercelConfig): string {
    return `/**
 * Vercel Edge Function للموجه: ${promptId}
 * تم التوليد تلقائياً في: ${new Date().toISOString()}
 */

export const config = {
  runtime: 'edge',
  regions: ${JSON.stringify(config.regions)}
};

export default async function handler(request) {
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
    const result = await executePrompt('${promptId}', variables, modelConfig);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
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

/**
 * تنفيذ الموجه باستخدام LLM API
 */
async function executePrompt(promptId, variables, config) {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('مفتاح API غير متوفر');
  }

  // استبدال المتغيرات في الموجه
  const processedPrompt = substituteVariables(getPromptTemplate(promptId), variables);

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
    throw new Error(\`خطأ في API: \${response.status}\`);
  }

  const data = await response.json();
  
  return {
    output: data.choices[0].message.content,
    usage: data.usage,
    model: data.model
  };
}

/**
 * الحصول على قالب الموجه
 */
function getPromptTemplate(promptId) {
  // هنا يمكن تحميل الموجه من قاعدة البيانات أو ملف
  return \`أنت مساعد ذكي. الرجاء الإجابة على السؤال التالي: {input}\`;
}

/**
 * استبدال المتغيرات في النص
 */
function substituteVariables(text, variables) {
  let result = text;
  for (const [key, value] of Object.entries(variables || {})) {
    const regex = new RegExp(\`\\\\{\${key}\\\\}\`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}`;
  }

  /**
   * توليد API Route عادي
   */
  private generateAPIRoute(promptId: string, config: VercelConfig): string {
    return `/**
 * Vercel API Route للموجه: ${promptId}
 * تم التوليد تلقائياً في: ${new Date().toISOString()}
 */

export default async function handler(req, res) {
  // معالجة CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { variables, config: modelConfig } = req.body;

    // تنفيذ الموجه
    const result = await executePrompt('${promptId}', variables, modelConfig);

    res.status(200).json(result);

  } catch (error) {
    console.error('خطأ في تنفيذ الموجه:', error);
    
    res.status(500).json({
      error: 'فشل في تنفيذ الموجه',
      message: error.message
    });
  }
}

/**
 * تنفيذ الموجه باستخدام LLM API
 */
async function executePrompt(promptId, variables, config) {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('مفتاح API غير متوفر');
  }

  // استبدال المتغيرات في الموجه
  const processedPrompt = substituteVariables(getPromptTemplate(promptId), variables);

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
    throw new Error(\`خطأ في API: \${response.status}\`);
  }

  const data = await response.json();
  
  return {
    output: data.choices[0].message.content,
    usage: data.usage,
    model: data.model
  };
}

/**
 * الحصول على قالب الموجه
 */
function getPromptTemplate(promptId) {
  // هنا يمكن تحميل الموجه من قاعدة البيانات أو ملف
  return \`أنت مساعد ذكي. الرجاء الإجابة على السؤال التالي: {input}\`;
}

/**
 * استبدال المتغيرات في النص
 */
function substituteVariables(text, variables) {
  let result = text;
  for (const [key, value] of Object.entries(variables || {})) {
    const regex = new RegExp(\`\\\\{\${key}\\\\}\`, 'g');
    result = result.replace(regex, value);
  }
  return result;
}`;
  }

  /**
   * توليد package.json
   */
  private generatePackageJson(config: VercelConfig): string {
    const packageConfig = {
      name: config.projectName,
      version: '1.0.0',
      description: `نشر Vercel للموجه - ${config.projectName}`,
      main: 'api/execute.js',
      scripts: {
        dev: 'vercel dev',
        build: 'vercel build',
        deploy: 'vercel --prod'
      },
      dependencies: {
        '@vercel/node': '^3.0.0'
      },
      engines: {
        node: '>=18.0.0'
      }
    };

    return JSON.stringify(packageConfig, null, 2);
  }

  /**
   * توليد README
   */
  private generateReadme(config: VercelConfig): string {
    return `# ${config.projectName}

نشر Vercel تم توليده تلقائياً للموجه.

## المنصة
Vercel ${config.runtime === 'edge' ? 'Edge Functions' : 'API Routes'}

## البيئة
${config.environment}

## المناطق
${config.regions.join(', ')}

## النشر

\`\`\`bash
# تثبيت Vercel CLI
npm i -g vercel

# نشر للإنتاج
vercel --prod
\`\`\`

## الاستخدام

\`\`\`bash
curl -X POST "https://your-deployment-url/api/execute" \\
  -H "Content-Type: application/json" \\
  -d '{
    "variables": {
      "input": "مثال على النص"
    },
    "config": {
      "model": "llama-3.3-70b-versatile",
      "temperature": 0.7
    }
  }'
\`\`\`

تم التوليد في: ${new Date().toISOString()}
`;
  }

  /**
   * توليد ملف البيئة المثال
   */
  private generateEnvExample(config: VercelConfig): string {
    const envVars = [
      '# مفاتيح API المطلوبة',
      'GROQ_API_KEY=your_groq_api_key_here',
      'OPENAI_API_KEY=your_openai_api_key_here',
      '',
      '# إعدادات التطبيق',
      `PROJECT_NAME=${config.projectName}`,
      `ENVIRONMENT=${config.environment}`,
      '',
      '# إعدادات إضافية'
    ];

    // إضافة متغيرات البيئة المخصصة
    Object.entries(config.envVars || {}).forEach(([key, value]) => {
      envVars.push(`${key}=${value}`);
    });

    return envVars.join('\n');
  }

  /**
   * تنسيق متغيرات البيئة لـ Vercel
   */
  private formatEnvVars(envVars: Record<string, string>): Record<string, string> {
    const formatted: Record<string, string> = {};
    
    Object.entries(envVars).forEach(([key, value]) => {
      formatted[key] = value;
    });

    return formatted;
  }
}

export const vercelGenerator = new VercelGenerator();