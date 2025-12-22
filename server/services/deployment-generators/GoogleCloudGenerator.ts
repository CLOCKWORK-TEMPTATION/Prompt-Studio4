/**
 * مولد Google Cloud Functions للنشر السحابي
 * يقوم بإنشاء ملفات النشر المطلوبة لمنصة Google Cloud Functions
 */

import { DeploymentConfig, DeploymentFiles } from '../CloudDeploymentService';

export interface GoogleCloudConfig extends DeploymentConfig {
  runtime: 'nodejs18' | 'nodejs20' | 'python39' | 'python311';
  memoryMB?: number;
  timeoutSeconds?: number;
  maxInstances?: number;
  minInstances?: number;
  trigger?: 'http' | 'pubsub' | 'storage';
  vpc?: {
    connector: string;
    egressSettings: 'PRIVATE_RANGES_ONLY' | 'ALL_TRAFFIC';
  };
}

export class GoogleCloudGenerator {
  private logger = console;

  /**
   * توليد ملفات النشر لـ Google Cloud Functions
   */
  async generateDeploymentFiles(
    promptId: string,
    config: GoogleCloudConfig
  ): Promise<DeploymentFiles> {
    this.logger.info(`توليد ملفات Google Cloud Functions للموجه: ${promptId}`);

    const files: DeploymentFiles = {};

    // إنشاء cloudbuild.yaml
    files['cloudbuild.yaml'] = this.generateCloudBuildConfig(config);

    // إنشاء Cloud Function
    files['index.js'] = this.generateCloudFunction(promptId, config);

    // إنشاء package.json
    files['package.json'] = this.generatePackageJson(config);

    // إنشاء README
    files['README.md'] = this.generateReadme(config);

    // إنشاء .gcloudignore
    files['.gcloudignore'] = this.generateGCloudIgnore();

    // إنشاء deployment script
    files['deploy.sh'] = this.generateDeployScript(config);

    return files;
  }

  /**
   * توليد ملف cloudbuild.yaml
   */
  private generateCloudBuildConfig(config: GoogleCloudConfig): string {
    const buildConfig = {
      steps: [
        {
          name: 'gcr.io/cloud-builders/gcloud',
          args: [
            'functions',
            'deploy',
            config.projectName,
            '--runtime',
            config.runtime,
            '--trigger-http',
            '--allow-unauthenticated',
            '--region',
            config.region,
            '--memory',
            `${config.memoryMB || 512}MB`,
            '--timeout',
            `${config.timeoutSeconds || 60}s`
          ]
        }
      ],
      options: {
        logging: 'CLOUD_LOGGING_ONLY'
      }
    };

    return JSON.stringify(buildConfig, null, 2);
  }

  /**
   * توليد Cloud Function
   */
  private generateCloudFunction(promptId: string, config: GoogleCloudConfig): string {
    return `/**
 * Google Cloud Function للموجه: ${promptId}
 * تم التوليد تلقائياً في: ${new Date().toISOString()}
 */

const functions = require('@google-cloud/functions-framework');

/**
 * معالج HTTP الرئيسي
 */
functions.http('${config.projectName}', async (req, res) => {
  // إعداد CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // معالجة OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  // التحقق من الطريقة
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { variables, config: modelConfig } = req.body;

    // تنفيذ الموجه
    const result = await executePrompt(
      '${promptId}',
      variables,
      modelConfig
    );

    res.status(200).json(result);

  } catch (error) {
    console.error('خطأ في تنفيذ الموجه:', error);
    
    res.status(500).json({
      error: 'فشل في تنفيذ الموجه',
      message: error.message
    });
  }
});

/**
 * تنفيذ الموجه باستخدام LLM API
 */
async function executePrompt(promptId, variables, config) {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  
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
    timestamp: new Date().toISOString()
  };
}

/**
 * الحصول على قالب الموجه
 */
function getPromptTemplate(promptId) {
  // هنا يمكن تحميل الموجه من Firestore أو Cloud Storage
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
  }

  /**
   * توليد package.json
   */
  private generatePackageJson(config: GoogleCloudConfig): string {
    const packageConfig = {
      name: config.projectName,
      version: '1.0.0',
      description: `نشر Google Cloud Functions للموجه - ${config.projectName}`,
      main: 'index.js',
      scripts: {
        start: 'functions-framework --target=execute',
        deploy: `gcloud functions deploy ${config.projectName} --runtime ${config.runtime} --trigger-http --allow-unauthenticated`
      },
      dependencies: {
        '@google-cloud/functions-framework': '^3.0.0'
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
  private generateReadme(config: GoogleCloudConfig): string {
    return `# ${config.projectName}

نشر Google Cloud Functions تم توليده تلقائياً للموجه.

## المنصة
Google Cloud Functions

## البيئة
${config.environment}

## المنطقة
${config.region}

## النشر

\`\`\`bash
# تثبيت Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# تسجيل الدخول
gcloud auth login

# تعيين المشروع
gcloud config set project YOUR_PROJECT_ID

# نشر الدالة
gcloud functions deploy ${config.projectName} \\
  --runtime ${config.runtime} \\
  --trigger-http \\
  --allow-unauthenticated \\
  --region ${config.region} \\
  --memory ${config.memoryMB || 512}MB \\
  --timeout ${config.timeoutSeconds || 60}s
\`\`\`

## الاستخدام

\`\`\`bash
curl -X POST "https://${config.region}-YOUR_PROJECT_ID.cloudfunctions.net/${config.projectName}" \\
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
   * توليد .gcloudignore
   */
  private generateGCloudIgnore(): string {
    return `# Node.js dependencies
node_modules/
npm-debug.log
yarn-error.log

# Environment files
.env
.env.local
.env.*.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Build files
dist/
build/

# Test files
test/
*.test.js
coverage/

# Documentation
docs/
README.md
`;
  }

  /**
   * توليد script النشر
   */
  private generateDeployScript(config: GoogleCloudConfig): string {
    return `#!/bin/bash

# نشر Google Cloud Function
# تم التوليد تلقائياً في: ${new Date().toISOString()}

set -e

echo "بدء نشر ${config.projectName}..."

# التحقق من تسجيل الدخول
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "خطأ: يجب تسجيل الدخول أولاً باستخدام 'gcloud auth login'"
    exit 1
fi

# التحقق من تعيين المشروع
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "خطأ: يجب تعيين معرف المشروع باستخدام 'gcloud config set project PROJECT_ID'"
    exit 1
fi

echo "نشر إلى المشروع: $PROJECT_ID"

# نشر الدالة
gcloud functions deploy ${config.projectName} \\
  --runtime ${config.runtime} \\
  --trigger-http \\
  --allow-unauthenticated \\
  --region ${config.region} \\
  --memory ${config.memoryMB || 512}MB \\
  --timeout ${config.timeoutSeconds || 60}s \\
  --set-env-vars $(cat .env | grep -v '^#' | xargs | tr ' ' ',')

echo "تم النشر بنجاح!"
echo "URL: https://${config.region}-$PROJECT_ID.cloudfunctions.net/${config.projectName}"
`;
  }
}

export const googleCloudGenerator = new GoogleCloudGenerator();