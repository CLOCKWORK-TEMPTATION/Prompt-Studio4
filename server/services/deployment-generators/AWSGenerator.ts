/**
 * مولد AWS Lambda للنشر السحابي
 * يقوم بإنشاء ملفات النشر المطلوبة لمنصة AWS Lambda
 */

import { DeploymentConfig, DeploymentFiles } from '../CloudDeploymentService';

export interface AWSConfig extends DeploymentConfig {
  runtime: 'nodejs18.x' | 'nodejs20.x' | 'python3.9' | 'python3.11';
  memorySize?: number;
  timeout?: number;
  layers?: string[];
  vpc?: {
    securityGroupIds: string[];
    subnetIds: string[];
  };
}

export class AWSGenerator {
  private logger = console;

  /**
   * توليد ملفات النشر لـ AWS Lambda
   */
  async generateDeploymentFiles(
    promptId: string,
    config: AWSConfig
  ): Promise<DeploymentFiles> {
    this.logger.info(`توليد ملفات AWS Lambda للموجه: ${promptId}`);

    const files: DeploymentFiles = {};

    // إنشاء serverless.yml
    files['serverless.yml'] = this.generateServerlessConfig(config);

    // إنشاء Lambda Handler
    files['handler.js'] = this.generateLambdaHandler(promptId, config);

    // إنشاء package.json
    files['package.json'] = this.generatePackageJson(config);

    // إنشاء README
    files['README.md'] = this.generateReadme(config);

    // إنشاء CloudFormation template
    files['cloudformation.yml'] = this.generateCloudFormationTemplate(config);

    return files;
  }

  /**
   * توليد ملف serverless.yml
   */
  private generateServerlessConfig(config: AWSConfig): string {
    const serverlessConfig = [
      `service: ${config.projectName}`,
      '',
      'provider:',
      '  name: aws',
      `  runtime: ${config.runtime}`,
      `  region: ${config.region}`,
      `  memorySize: ${config.memorySize || 512}`,
      `  timeout: ${config.timeout || 30}`,
      '  environment:',
    ];

    // إضافة متغيرات البيئة
    Object.entries(config.envVars || {}).forEach(([key, value]) => {
      serverlessConfig.push(`    ${key}: ${value}`);
    });

    // إضافة VPC إن وجدت
    if (config.vpc) {
      serverlessConfig.push('  vpc:');
      serverlessConfig.push(`    securityGroupIds:`);
      config.vpc.securityGroupIds.forEach(id => {
        serverlessConfig.push(`      - ${id}`);
      });
      serverlessConfig.push(`    subnetIds:`);
      config.vpc.subnetIds.forEach(id => {
        serverlessConfig.push(`      - ${id}`);
      });
    }

    // إضافة Functions
    serverlessConfig.push('');
    serverlessConfig.push('functions:');
    serverlessConfig.push('  execute:');
    serverlessConfig.push('    handler: handler.execute');
    serverlessConfig.push('    events:');
    serverlessConfig.push('      - http:');
    serverlessConfig.push('          path: execute');
    serverlessConfig.push('          method: post');
    serverlessConfig.push('          cors: true');

    // إضافة Layers إن وجدت
    if (config.layers && config.layers.length > 0) {
      serverlessConfig.push('    layers:');
      config.layers.forEach(layer => {
        serverlessConfig.push(`      - ${layer}`);
      });
    }

    return serverlessConfig.join('\n');
  }

  /**
   * توليد Lambda Handler
   */
  private generateLambdaHandler(promptId: string, config: AWSConfig): string {
    return `/**
 * AWS Lambda Handler للموجه: ${promptId}
 * تم التوليد تلقائياً في: ${new Date().toISOString()}
 */

const AWS = require('aws-sdk');

/**
 * معالج Lambda الرئيسي
 */
exports.execute = async (event, context) => {
  // إعداد CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };

  // معالجة OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // التحقق من الطريقة
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // استخراج البيانات من الطلب
    const body = typeof event.body === 'string' 
      ? JSON.parse(event.body) 
      : event.body;
    
    const { variables, config: modelConfig } = body;

    // تنفيذ الموجه
    const result = await executePrompt(
      '${promptId}',
      variables,
      modelConfig,
      context
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('خطأ في تنفيذ الموجه:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'فشل في تنفيذ الموجه',
        message: error.message,
        requestId: context.awsRequestId
      })
    };
  }
};

/**
 * تنفيذ الموجه باستخدام LLM API
 */
async function executePrompt(promptId, variables, config, context) {
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('مفتاح API غير متوفر');
  }

  // استبدال المتغيرات في الموجه
  const processedPrompt = substituteVariables(
    getPromptTemplate(promptId),
    variables
  );

  // إعداد timeout للطلب
  const timeoutMs = Math.min((context.getRemainingTimeInMillis() - 1000), 25000);

  // استدعاء LLM API مع timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
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
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(\`خطأ في API: \${response.status} - \${errorText}\`);
    }

    const data = await response.json();
    
    return {
      output: data.choices[0].message.content,
      usage: data.usage,
      model: data.model,
      executionTime: Date.now() - context.startTime,
      requestId: context.awsRequestId
    };

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('انتهت مهلة تنفيذ الطلب');
    }
    
    throw error;
  }
}

/**
 * الحصول على قالب الموجه
 */
function getPromptTemplate(promptId) {
  // هنا يمكن تحميل الموجه من DynamoDB أو S3
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