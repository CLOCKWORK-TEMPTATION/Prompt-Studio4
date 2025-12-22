import { PromptConfig, SDKGenerationOptions, GeneratedSDK } from './types';

/**
 * JavaScript/Node.js SDK Generator
 */
export function generateJavaScriptSDK(
  promptConfig: PromptConfig,
  options: SDKGenerationOptions
): GeneratedSDK {
  const code = generateJavaScriptCode(promptConfig, options);

  return {
    language: 'typescript', // Reusing typescript type
    code,
    filename: `${options.className || 'PromptClient'}.js`,
    dependencies: [
      'axios',
      ...(options.includeRetryLogic ? ['axios-retry'] : []),
    ],
  };
}

function generateJavaScriptCode(
  config: PromptConfig,
  options: SDKGenerationOptions
): string {
  const className = options.className || 'PromptClient';
  const functionName = options.functionName || 'execute';

  return `/**
 * Auto-generated SDK for ${config.name}
 * ${config.description}
 *
 * @generated ${new Date().toISOString()}
 * @version 1.0.0
 */

const axios = require('axios');
${options.includeRetryLogic ? "const axiosRetry = require('axios-retry');" : ''}

/**
 * Custom error class for PromptStudio SDK
 */
class PromptStudioError extends Error {
  constructor(message, code, details) {
    super(message);
    this.name = 'PromptStudioError';
    this.code = code;
    this.details = details;
  }
}

${options.includeRetryLogic ? `
/**
 * Sleep utility for retry logic
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Exponential backoff retry wrapper
 */
async function withRetry(fn, maxRetries = ${options.retryAttempts}, baseDelay = ${options.retryDelay}) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
` : ''}

/**
 * ${className} - Client for ${config.name}
 */
class ${className} {
  /**
   * Create a new ${className} instance
   *
   * @param {Object} config - Configuration options
   * @param {string} config.apiKey - Your PromptStudio API key
   * @param {string} [config.baseURL='https://api.promptstudio.ai/v1'] - Base URL for the API
   * @param {number} [config.timeout=${options.timeout}] - Request timeout in milliseconds
   * @param {number} [config.maxRetries=${options.retryAttempts}] - Maximum retry attempts
   * @param {number} [config.retryDelay=${options.retryDelay}] - Base delay between retries in milliseconds
   */
  constructor(config) {
    this.config = {
      baseURL: 'https://api.promptstudio.ai/v1',
      timeout: ${options.timeout},
      maxRetries: ${options.retryAttempts},
      retryDelay: ${options.retryDelay},
      ...config,
    };

    this.axios = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Authorization': \`Bearer \${this.config.apiKey}\`,
        'Content-Type': 'application/json',
      },
    });

    ${options.includeRetryLogic ? `
    // Setup axios-retry
    axiosRetry(this.axios, {
      retries: this.config.maxRetries,
      retryDelay: (retryCount) => {
        return this.config.retryDelay * Math.pow(2, retryCount - 1);
      },
      retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
               (error.response?.status >= 500);
      },
    });` : ''}
  }

  /**
   * Execute the prompt with the given input
   *
   * @param {Object} input - The input parameters for the prompt
${config.variables.map(v => `   * @param {${mapTypeToJSDoc(v.type)}} ${v.required ? '' : '['}input.${v.name}${v.required ? '' : ']'} - ${v.description}`).join('\n')}
   * @returns {Promise<Object>} Promise resolving to the API response
   * @throws {PromptStudioError} If the API request fails
   */
  async ${functionName}(input) {
    ${options.includeErrorHandling ? 'try {' : ''}
      // Validate input
      this._validateInput(input);

      ${options.includeRetryLogic ? 'const response = await withRetry(async () => {' : ''}
        ${options.includeRetryLogic ? 'return await ' : 'const response = await '}this.axios.post('/execute', {
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
        });
      ${options.includeRetryLogic ? `}, this.config.maxRetries, this.config.retryDelay);` : ''}

      return response.data;
    ${options.includeErrorHandling ? `} catch (error) {
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

  /**
   * Execute the prompt with streaming response
   *
   * @param {Object} input - The input parameters for the prompt
   * @param {Function} onChunk - Callback for each chunk of data
   * @returns {Promise<void>} Promise resolving when the stream is complete
   */
  async ${functionName}Stream(input, onChunk) {
    ${options.includeErrorHandling ? 'try {' : ''}
      this._validateInput(input);

      const response = await this.axios.post('/execute/stream', {
        prompt: '${config.id}',
        variables: input,
      }, {
        responseType: 'stream',
      });

      response.data.on('data', (chunk) => {
        onChunk(chunk.toString());
      });

      return new Promise((resolve, reject) => {
        response.data.on('end', resolve);
        response.data.on('error', reject);
      });
    ${options.includeErrorHandling ? `} catch (error) {
      throw new PromptStudioError(
        error.message || 'Stream failed',
        'STREAM_ERROR',
        { originalError: error }
      );
    }` : ''}
  }

  /**
   * Validate input parameters
   * @private
   */
  _validateInput(input) {
    ${config.variables.filter(v => v.required).map(v => `
    if (input.${v.name} === undefined || input.${v.name} === null) {
      throw new PromptStudioError(
        'Missing required parameter: ${v.name}',
        'VALIDATION_ERROR',
        { parameter: '${v.name}' }
      );
    }`).join('\n    ')}
  }
}

/**
 * Factory function to create a new client instance
 *
 * @param {string} apiKey - Your PromptStudio API key
 * @param {Object} [config={}] - Optional configuration overrides
 * @returns {${className}} A new instance of ${className}
 */
function create${className}(apiKey, config = {}) {
  return new ${className}({
    apiKey,
    ...config,
  });
}

module.exports = {
  ${className},
  create${className},
  PromptStudioError,
};`;
}

function mapTypeToJSDoc(type: string): string {
  switch (type) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'array':
      return 'Array';
    case 'object':
      return 'Object';
    default:
      return '*';
  }
}
