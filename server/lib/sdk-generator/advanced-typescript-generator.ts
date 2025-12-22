import { PromptConfig, SDKGenerationOptions, GeneratedSDK, PromptVariable } from './types';

/**
 * Advanced TypeScript SDK Generator
 * Generates production-ready TypeScript SDK with advanced features
 */
export function generateAdvancedTypeScriptSDK(
  promptConfig: PromptConfig,
  options: SDKGenerationOptions
): GeneratedSDK {
  const types = generateTypeScriptTypes(promptConfig);
  const client = generateTypeScriptClient(promptConfig, options);
  const utils = generateTypeScriptUtils(options);

  const code = `${types}\n\n${utils}\n\n${client}`;

  return {
    language: 'typescript',
    code,
    types,
    filename: `${options.className || 'PromptClient'}.ts`,
    dependencies: [
      'axios',
      ...(options.includeRetryLogic ? ['axios-retry'] : []),
    ],
  };
}

function generateTypeScriptTypes(config: PromptConfig): string {
  const variableTypes = config.variables
    .map((v) => `  ${v.name}${v.required ? '' : '?'}: ${mapTypeToTS(v.type)};`)
    .join('\n');

  return `/**
 * Auto-generated SDK for ${config.name}
 * ${config.description}
 *
 * @generated ${new Date().toISOString()}
 * @version 1.0.0
 */

/**
 * Input parameters for ${config.name}
 */
export interface PromptInput {
${variableTypes || '  // No variables defined'}
}

/**
 * Response from the API
 */
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

/**
 * Error response from the API
 */
export interface PromptError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Configuration options for the client
 */
export interface ClientConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}`;
}

function generateTypeScriptUtils(options: SDKGenerationOptions): string {
  return `/**
 * Utility functions
 */

class PromptStudioError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'PromptStudioError';
  }
}

${options.includeRetryLogic ? `
/**
 * Sleep utility for retry logic
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff retry
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = ${options.retryAttempts},
  baseDelay: number = ${options.retryDelay}
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if ((error as any).response?.status >= 400 && (error as any).response?.status < 500) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError!;
}
` : ''}`;
}

function generateTypeScriptClient(
  config: PromptConfig,
  options: SDKGenerationOptions
): string {
  const className = options.className || 'PromptClient';
  const functionName = options.functionName || 'execute';
  const isAsync = options.asyncMode;

  return `/**
 * ${className} - Client for ${config.name}
 */
export class ${className} {
  private config: ClientConfig;
  private axios: any;

  constructor(config: ClientConfig) {
    this.config = {
      baseURL: 'https://api.promptstudio.ai/v1',
      timeout: ${options.timeout},
      maxRetries: ${options.retryAttempts},
      retryDelay: ${options.retryDelay},
      ...config,
    };

    this.axios = require('axios').default.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Authorization': \`Bearer \${this.config.apiKey}\`,
        'Content-Type': 'application/json',
      },
    });
  }

  ${options.includeDocstrings ? `
  /**
   * Execute the prompt with the given input
   *
   * @param input - The input parameters for the prompt
   * @returns Promise resolving to the API response
   * @throws {PromptStudioError} If the API request fails
   */` : ''}
  ${isAsync ? 'async' : ''} ${functionName}(input: PromptInput): ${isAsync ? 'Promise<PromptResponse>' : 'PromptResponse'} {
    ${options.includeErrorHandling ? 'try {' : ''}
      ${options.includeRetryLogic ? `const response = await withRetry(async () => {` : 'const response = await'} this.axios.post('/execute', {
        prompt: '${config.id}',
        variables: input,
        config: {
          model: '${config.model}',
          temperature: ${config.temperature},
          max_tokens: ${config.maxTokens},
          top_p: ${config.topP},
          frequency_penalty: ${config.frequencyPenalty},
          presence_penalty: ${config.presencePenalty},
          ${config.stopSequences.length > 0 ? `stop: ${JSON.stringify(config.stopSequences)},` : ''}
        },
      })${options.includeRetryLogic ? `
      }, this.config.maxRetries, this.config.retryDelay);` : ';'}

      return response.data;
    ${options.includeErrorHandling ? `} catch (error: any) {
      if (error.response) {
        throw new PromptStudioError(
          error.response.data.message || 'API request failed',
          error.response.data.code || 'UNKNOWN_ERROR',
          error.response.data.details
        );
      } else if (error.request) {
        throw new PromptStudioError(
          'No response from server',
          'NETWORK_ERROR',
          { originalError: error.message }
        );
      } else {
        throw new PromptStudioError(
          error.message || 'Unknown error',
          'CLIENT_ERROR',
          { originalError: error }
        );
      }
    }` : ''}
  }

  ${options.includeDocstrings ? `
  /**
   * Execute the prompt with streaming response
   *
   * @param input - The input parameters for the prompt
   * @param onChunk - Callback for each chunk of data
   * @returns Promise resolving when the stream is complete
   */` : ''}
  async ${functionName}Stream(
    input: PromptInput,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    ${options.includeErrorHandling ? 'try {' : ''}
      const response = await this.axios.post('/execute/stream', {
        prompt: '${config.id}',
        variables: input,
      }, {
        responseType: 'stream',
      });

      for await (const chunk of response.data) {
        onChunk(chunk.toString());
      }
    ${options.includeErrorHandling ? `} catch (error: any) {
      throw new PromptStudioError(
        error.message || 'Stream failed',
        'STREAM_ERROR',
        { originalError: error }
      );
    }` : ''}
  }

  ${options.includeDocstrings ? `
  /**
   * Validate input before sending to API
   *
   * @param input - The input to validate
   * @returns true if valid, throws error otherwise
   */` : ''}
  private validateInput(input: PromptInput): boolean {
    ${config.variables.filter(v => v.required).map(v => `
    if (input.${v.name} === undefined || input.${v.name} === null) {
      throw new PromptStudioError(
        'Missing required parameter: ${v.name}',
        'VALIDATION_ERROR',
        { parameter: '${v.name}' }
      );
    }`).join('\n    ')}

    return true;
  }
}

/**
 * Factory function to create a new client instance
 *
 * @param apiKey - Your PromptStudio API key
 * @param config - Optional configuration overrides
 * @returns A new instance of ${className}
 */
export function create${className}(
  apiKey: string,
  config?: Partial<Omit<ClientConfig, 'apiKey'>>
): ${className} {
  return new ${className}({
    apiKey,
    ...config,
  });
}`;
}

function mapTypeToTS(type: string): string {
  switch (type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'any[]';
    case 'object':
      return 'Record<string, any>';
    default:
      return 'any';
  }
}
