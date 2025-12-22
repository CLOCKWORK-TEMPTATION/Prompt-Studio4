import { db } from '../storage';
import { prompts } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * واجهة إعدادات توليد SDK
 */
export interface SDKGenerationConfig {
  language: 'python' | 'typescript' | 'javascript' | 'go' | 'curl';
  packageName: string;
  version: string;
  description: string;
  author: string;
  includeRetryLogic: boolean;
  includeErrorHandling: boolean;
  includeTypeValidation: boolean;
}

/**
 * واجهة نتيجة توليد SDK
 */
export interface SDKGenerationResult {
  code: string;
  filename: string;
  dependencies: string[];
  installInstructions: string;
  usageExample: string;
}

/**
 * خدمة توليد SDK للموجهات
 */
export class SDKGeneratorService {
  private logger = console;

  /**
   * توليد SDK للموجه المحدد
   */
  async generateSDK(
    promptId: string, 
    config: SDKGenerationConfig
  ): Promise<SDKGenerationResult> {
    try {
      // الحصول على بيانات الموجه
      const prompt = await db.query.prompts.findFirst({
        where: eq(prompts.id, promptId)
      });

      if (!prompt) {
        throw new Error(`الموجه غير موجود: ${promptId}`);
      }

      // توليد الكود حسب اللغة المحددة
      switch (config.language) {
        case 'python':
          return this.generatePythonSDK(prompt, config);
        case 'typescript':
          return this.generateTypeScriptSDK(prompt, config);
        case 'javascript':
          return this.generateJavaScriptSDK(prompt, config);
        case 'go':
          return this.generateGoSDK(prompt, config);
        case 'curl':
          return this.generateCurlSDK(prompt, config);
        default:
          throw new Error(`اللغة غير مدعومة: ${config.language}`);
      }
    } catch (error) {
      this.logger.error('خطأ في توليد SDK:', error);
      throw error;
    }
  }

  /**
   * توليد Python SDK
   */
  private generatePythonSDK(prompt: any, config: SDKGenerationConfig): SDKGenerationResult {
    const className = this.toPascalCase(config.packageName);
    
    const code = `"""
${config.description}

Generated: ${new Date().toISOString()}
Version: ${config.version}
Author: ${config.author}
"""

import requests
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass
import json
import time
import logging

# إعداد نظام السجلات
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PromptConfig:
    """إعدادات الموجه"""
    api_key: str
    base_url: str = "https://api.promptstudio.ai/v1"
    timeout: int = 30
    max_retries: int = 3
    retry_delay: float = 1.0

class PromptStudioError(Exception):
    """استثناء مخصص لأخطاء PromptStudio"""
    def __init__(self, message: str, code: str = None, details: Dict = None):
        super().__init__(message)
        self.code = code
        self.details = details or {}

class ${className}:
    """عميل SDK للموجه: ${prompt.name}"""
    
    def __init__(self, config: PromptConfig):
        self.config = config
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {config.api_key}',
            'Content-Type': 'application/json',
            'User-Agent': f'${config.packageName}/{config.version}'
        })
    
    ${config.includeRetryLogic ? this.generatePythonRetryLogic() : ''}
    
    def execute(self, variables: Dict[str, Any] = None, **kwargs) -> Dict[str, Any]:
        """
        تنفيذ الموجه مع المتغيرات المحددة
        
        Args:
            variables: متغيرات الموجه
            **kwargs: معاملات إضافية للنموذج
            
        Returns:
            استجابة النموذج
            
        Raises:
            PromptStudioError: في حالة فشل الطلب
        """
        ${config.includeTypeValidation ? 'self._validate_input(variables)' : ''}
        
        payload = {
            'prompt_id': '${prompt.id}',
            'variables': variables or {},
            'config': {
                'model': kwargs.get('model', 'gpt-4'),
                'temperature': kwargs.get('temperature', 0.7),
                'max_tokens': kwargs.get('max_tokens', 1000),
                **kwargs
            }
        }
        
        try:
            ${config.includeRetryLogic ? 'response = self._execute_with_retry(payload)' : 'response = self._execute_request(payload)'}
            return response.json()
        except requests.RequestException as e:
            logger.error(f"خطأ في تنفيذ الموجه: {e}")
            raise PromptStudioError(f"فشل في تنفيذ الموجه: {str(e)}", "EXECUTION_ERROR")
    
    def _execute_request(self, payload: Dict) -> requests.Response:
        """تنفيذ طلب HTTP"""
        response = self.session.post(
            f"{self.config.base_url}/prompts/execute",
            json=payload,
            timeout=self.config.timeout
        )
        
        ${config.includeErrorHandling ? this.generatePythonErrorHandling() : 'response.raise_for_status()'}
        return response
    
    ${config.includeTypeValidation ? this.generatePythonValidation() : ''}

# مثال على الاستخدام
if __name__ == "__main__":
    config = PromptConfig(api_key="your-api-key-here")
    client = ${className}(config)
    
    result = client.execute({
        "input": "مثال على النص",
        "context": "سياق إضافي"
    })
    
    print(result)
`;

    return {
      code,
      filename: `${config.packageName.replace(/-/g, '_')}.py`,
      dependencies: ['requests', 'dataclasses'],
      installInstructions: `pip install requests`,
      usageExample: this.generatePythonUsageExample(config.packageName, className)
    };
  }

  /**
   * توليد TypeScript SDK
   */
  private generateTypeScriptSDK(prompt: any, config: SDKGenerationConfig): SDKGenerationResult {
    const className = this.toPascalCase(config.packageName);
    
    const code = `/**
 * ${config.description}
 * 
 * @generated ${new Date().toISOString()}
 * @version ${config.version}
 * @author ${config.author}
 */

export interface PromptConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface PromptVariables {
  [key: string]: any;
}

export interface PromptResponse {
  result: string;
  metadata?: {
    model: string;
    tokens: {
      prompt: number;
      completion: number;
      total: number;
    };
    latency: number;
  };
}

export interface ModelConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export class PromptStudioError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PromptStudioError';
  }
}

export class ${className} {
  private config: Required<PromptConfig>;

  constructor(config: PromptConfig) {
    this.config = {
      baseURL: 'https://api.promptstudio.ai/v1',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  /**
   * تنفيذ الموجه مع المتغيرات المحددة
   */
  async execute(
    variables: PromptVariables = {},
    modelConfig: ModelConfig = {}
  ): Promise<PromptResponse> {
    ${config.includeTypeValidation ? 'this.validateInput(variables);' : ''}

    const payload = {
      prompt_id: '${prompt.id}',
      variables,
      config: {
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 1000,
        ...modelConfig,
      },
    };

    try {
      ${config.includeRetryLogic ? 'return await this.executeWithRetry(payload);' : 'return await this.executeRequest(payload);'}
    } catch (error) {
      console.error('خطأ في تنفيذ الموجه:', error);
      throw new PromptStudioError(
        \`فشل في تنفيذ الموجه: \${error instanceof Error ? error.message : 'خطأ غير معروف'}\`,
        'EXECUTION_ERROR',
        { originalError: error }
      );
    }
  }

  private async executeRequest(payload: any): Promise<PromptResponse> {
    const response = await fetch(\`\${this.config.baseURL}/prompts/execute\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.config.apiKey}\`,
        'Content-Type': 'application/json',
        'User-Agent': \`${config.packageName}/\${this.config.version || '1.0.0'}\`,
      },
      body: JSON.stringify(payload),
    });

    ${config.includeErrorHandling ? this.generateTypeScriptErrorHandling() : 'if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);'}

    return await response.json();
  }

  ${config.includeRetryLogic ? this.generateTypeScriptRetryLogic() : ''}
  ${config.includeTypeValidation ? this.generateTypeScriptValidation() : ''}
}

// تصدير مصنع لإنشاء العميل
export function create${className}(apiKey: string, config?: Partial<PromptConfig>): ${className} {
  return new ${className}({ apiKey, ...config });
}
`;

    return {
      code,
      filename: `${config.packageName}.ts`,
      dependencies: ['typescript'],
      installInstructions: `npm install ${config.packageName}`,
      usageExample: this.generateTypeScriptUsageExample(config.packageName, className)
    };
  }

  /**
   * توليد JavaScript SDK
   */
  private generateJavaScriptSDK(prompt: any, config: SDKGenerationConfig): SDKGenerationResult {
    // مشابه لـ TypeScript لكن بدون أنواع البيانات
    const code = `// ${config.description} - JavaScript SDK`;
    
    return {
      code,
      filename: `${config.packageName}.js`,
      dependencies: ['axios'],
      installInstructions: `npm install ${config.packageName}`,
      usageExample: `const client = new PromptClient('your-api-key');`
    };
  }

  /**
   * توليد Go SDK
   */
  private generateGoSDK(prompt: any, config: SDKGenerationConfig): SDKGenerationResult {
    const code = `// ${config.description} - Go SDK
package main

// Go SDK implementation here
`;
    
    return {
      code,
      filename: `${config.packageName}.go`,
      dependencies: ['net/http', 'encoding/json'],
      installInstructions: `go get github.com/user/${config.packageName}`,
      usageExample: `client := NewPromptClient("your-api-key")`
    };
  }

  /**
   * توليد cURL SDK
   */
  private generateCurlSDK(prompt: any, config: SDKGenerationConfig): SDKGenerationResult {
    const code = `#!/bin/bash
# ${config.description} - cURL SDK

API_KEY="your-api-key-here"
BASE_URL="https://api.promptstudio.ai/v1"

# تنفيذ الموجه
curl -X POST "\${BASE_URL}/prompts/execute" \\
  -H "Authorization: Bearer \${API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt_id": "${prompt.id}",
    "variables": {
      "input": "مثال على النص"
    },
    "config": {
      "model": "gpt-4",
      "temperature": 0.7
    }
  }'
`;

    return {
      code,
      filename: `${config.packageName}.sh`,
      dependencies: ['curl'],
      installInstructions: 'curl is usually pre-installed on most systems',
      usageExample: `chmod +x ${config.packageName}.sh && ./${config.packageName}.sh`
    };
  }

  // دوال مساعدة لتوليد أجزاء الكود

  private generatePythonRetryLogic(): string {
    return `
    def _execute_with_retry(self, payload: Dict) -> requests.Response:
        """تنفيذ الطلب مع إعادة المحاولة"""
        last_error = None
        
        for attempt in range(self.config.max_retries + 1):
            try:
                return self._execute_request(payload)
            except requests.RequestException as e:
                last_error = e
                if attempt < self.config.max_retries:
                    delay = self.config.retry_delay * (2 ** attempt)
                    logger.warning(f"فشل المحاولة {attempt + 1}، إعادة المحاولة خلال {delay} ثانية")
                    time.sleep(delay)
                else:
                    logger.error(f"فشل جميع المحاولات ({self.config.max_retries + 1})")
        
        raise last_error
    `;
  }

  private generatePythonErrorHandling(): string {
    return `
        if response.status_code >= 400:
            error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
            raise PromptStudioError(
                error_data.get('message', f'HTTP {response.status_code}'),
                error_data.get('code', 'HTTP_ERROR'),
                error_data.get('details', {})
            )
    `;
  }

  private generatePythonValidation(): string {
    return `
    def _validate_input(self, variables: Dict[str, Any]) -> None:
        """التحقق من صحة المدخلات"""
        if not isinstance(variables, dict):
            raise PromptStudioError("المتغيرات يجب أن تكون من نوع dict", "VALIDATION_ERROR")
        
        # يمكن إضافة المزيد من قواعد التحقق هنا
    `;
  }

  private generateTypeScriptRetryLogic(): string {
    return `
  private async executeWithRetry(payload: any): Promise<PromptResponse> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        return await this.executeRequest(payload);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          console.warn(\`فشل المحاولة \${attempt + 1}، إعادة المحاولة خلال \${delay}ms\`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }
    `;
  }

  private generateTypeScriptErrorHandling(): string {
    return `
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new PromptStudioError(
        errorData.message || \`HTTP \${response.status}: \${response.statusText}\`,
        errorData.code || 'HTTP_ERROR',
        errorData.details
      );
    }
    `;
  }

  private generateTypeScriptValidation(): string {
    return `
  private validateInput(variables: PromptVariables): void {
    if (typeof variables !== 'object' || variables === null) {
      throw new PromptStudioError('المتغيرات يجب أن تكون كائن صالح', 'VALIDATION_ERROR');
    }
  }
    `;
  }

  private generatePythonUsageExample(packageName: string, className: string): string {
    return `
from ${packageName.replace(/-/g, '_')} import ${className}, PromptConfig

# إعداد العميل
config = PromptConfig(api_key="your-api-key-here")
client = ${className}(config)

# تنفيذ الموجه
result = client.execute({
    "input": "مثال على النص",
    "context": "سياق إضافي"
})

print(result)
    `;
  }

  private generateTypeScriptUsageExample(packageName: string, className: string): string {
    return `
import { ${className} } from '${packageName}';

// إعداد العميل
const client = new ${className}({
  apiKey: 'your-api-key-here'
});

// تنفيذ الموجه
const result = await client.execute({
  input: 'مثال على النص',
  context: 'سياق إضافي'
});

console.log(result);
    `;
  }

  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * الحصول على قائمة اللغات المدعومة
   */
  getSupportedLanguages(): string[] {
    return ['python', 'typescript', 'javascript', 'go', 'curl'];
  }

  /**
   * التحقق من صحة إعدادات التوليد
   */
  validateConfig(config: SDKGenerationConfig): void {
    if (!config.packageName || config.packageName.trim() === '') {
      throw new Error('اسم الحزمة مطلوب');
    }

    if (!config.version || config.version.trim() === '') {
      throw new Error('رقم الإصدار مطلوب');
    }

    if (!this.getSupportedLanguages().includes(config.language)) {
      throw new Error(`اللغة غير مدعومة: ${config.language}`);
    }
  }
}

// إنشاء مثيل مشترك
export const sdkGeneratorService = new SDKGeneratorService();