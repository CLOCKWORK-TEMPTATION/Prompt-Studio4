import { PromptConfig, SDKGenerationOptions, GeneratedSDK, PromptVariable } from './types';

/**
 * Advanced Python SDK Generator
 * Generates production-ready Python SDK with advanced features
 */
export function generateAdvancedPythonSDK(
  promptConfig: PromptConfig,
  options: SDKGenerationOptions
): GeneratedSDK {
  const types = generatePythonTypes(promptConfig, options);
  const client = generatePythonClient(promptConfig, options);
  const utils = generatePythonUtils(options);

  const code = `${types}\n\n${utils}\n\n${client}`;

  return {
    language: 'python',
    code,
    types,
    filename: `${toSnakeCase(options.className || 'PromptClient')}.py`,
    dependencies: [
      'requests',
      ...(options.includeTypes ? ['typing', 'dataclasses'] : []),
      ...(options.includeRetryLogic ? ['tenacity'] : []),
    ],
  };
}

function generatePythonTypes(config: PromptConfig, options: SDKGenerationOptions): string {
  if (!options.includeTypes) return '';

  const fields = config.variables
    .map((v) => {
      const typeStr = mapTypeToPython(v.type);
      const optional = !v.required ? ' | None = None' : '';
      return `    ${v.name}: ${typeStr}${optional}`;
    })
    .join('\n');

  return `\"\"\"
Auto-generated SDK for ${config.name}
${config.description}

Generated: ${new Date().toISOString()}
Version: 1.0.0
\"\"\"

from dataclasses import dataclass
from typing import Dict, List, Optional, Any, Callable
from enum import Enum
import requests
import time
${options.includeRetryLogic ? 'from tenacity import retry, stop_after_attempt, wait_exponential' : ''}


@dataclass
class PromptInput:
    \"\"\"Input parameters for ${config.name}\"\"\"
${fields || '    pass  # No variables defined'}


@dataclass
class TokenUsage:
    \"\"\"Token usage information\"\"\"
    prompt: int
    completion: int
    total: int


@dataclass
class ResponseMetadata:
    \"\"\"Response metadata\"\"\"
    model: str
    tokens: TokenUsage
    latency: float


@dataclass
class PromptResponse:
    \"\"\"Response from the API\"\"\"
    result: str
    metadata: Optional[ResponseMetadata] = None


class PromptStudioError(Exception):
    \"\"\"Base exception for PromptStudio SDK\"\"\"

    def __init__(self, message: str, code: str, details: Any = None):
        self.message = message
        self.code = code
        self.details = details
        super().__init__(self.message)


class ValidationError(PromptStudioError):
    \"\"\"Raised when input validation fails\"\"\"
    pass


class NetworkError(PromptStudioError):
    \"\"\"Raised when network request fails\"\"\"
    pass


class APIError(PromptStudioError):
    \"\"\"Raised when API returns an error\"\"\"
    pass`;
}

function generatePythonUtils(options: SDKGenerationOptions): string {
  if (!options.includeRetryLogic) return '';

  return `

def exponential_backoff(
    max_retries: int = ${options.retryAttempts},
    base_delay: float = ${options.retryDelay / 1000}
) -> Callable:
    \"\"\"
    Decorator for exponential backoff retry logic

    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Base delay in seconds

    Returns:
        Decorated function with retry logic
    \"\"\"
    return retry(
        stop=stop_after_attempt(max_retries),
        wait=wait_exponential(multiplier=base_delay, min=base_delay, max=60),
        reraise=True
    )`;
}

function generatePythonClient(
  config: PromptConfig,
  options: SDKGenerationOptions
): string {
  const className = options.className || 'PromptClient';
  const functionName = toSnakeCase(options.functionName || 'execute');

  return `

class ${className}:
    \"\"\"
    Client for ${config.name}

    ${config.description}

    Example:
        >>> client = ${className}(api_key="your-api-key")
        >>> result = client.${functionName}(PromptInput(...))
        >>> print(result.result)
    \"\"\"

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.promptstudio.ai/v1",
        timeout: float = ${options.timeout / 1000},
        max_retries: int = ${options.retryAttempts},
        retry_delay: float = ${options.retryDelay / 1000}
    ):
        \"\"\"
        Initialize the PromptStudio client

        Args:
            api_key: Your PromptStudio API key
            base_url: Base URL for the API (default: https://api.promptstudio.ai/v1)
            timeout: Request timeout in seconds (default: ${options.timeout / 1000})
            max_retries: Maximum retry attempts (default: ${options.retryAttempts})
            retry_delay: Base delay between retries in seconds (default: ${options.retryDelay / 1000})
        \"\"\"
        self.api_key = api_key
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay

        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        })

    ${options.includeRetryLogic ? `@exponential_backoff(max_retries=${options.retryAttempts})` : ''}
    def ${functionName}(self, input_data: PromptInput) -> PromptResponse:
        \"\"\"
        Execute the prompt with the given input

        Args:
            input_data: Input parameters for the prompt

        Returns:
            PromptResponse containing the result and metadata

        Raises:
            ValidationError: If input validation fails
            NetworkError: If network request fails
            APIError: If API returns an error
        \"\"\"
        ${options.includeErrorHandling ? '# Validate input\n        self._validate_input(input_data)\n\n        try:' : ''}
        # Prepare request payload
        payload = {
            'prompt': '${config.id}',
            'variables': self._to_dict(input_data),
            'config': {
                'model': '${config.model}',
                'temperature': ${config.temperature},
                'max_tokens': ${config.maxTokens},
                'top_p': ${config.topP},
                'frequency_penalty': ${config.frequencyPenalty},
                'presence_penalty': ${config.presencePenalty},
                ${config.stopSequences.length > 0 ? `'stop': ${JSON.stringify(config.stopSequences)},` : ''}
            }
        }

        # Make request
        response = self.session.post(
            f'{self.base_url}/execute',
            json=payload,
            timeout=self.timeout
        )

        # Handle response
        ${options.includeErrorHandling ? `if response.status_code >= 400:
            error_data = response.json()
            raise APIError(
                message=error_data.get('message', 'API request failed'),
                code=error_data.get('code', 'UNKNOWN_ERROR'),
                details=error_data.get('details')
            )

        ` : ''}response.raise_for_status()
        data = response.json()

        # Parse response
        metadata = None
        if 'metadata' in data:
            metadata = ResponseMetadata(
                model=data['metadata']['model'],
                tokens=TokenUsage(**data['metadata']['tokens']),
                latency=data['metadata']['latency']
            )

        return PromptResponse(
            result=data['result'],
            metadata=metadata
        )
        ${options.includeErrorHandling ? `
        except requests.exceptions.Timeout:
            raise NetworkError(
                message='Request timed out',
                code='TIMEOUT_ERROR',
                details={'timeout': self.timeout}
            )
        except requests.exceptions.ConnectionError as e:
            raise NetworkError(
                message='Connection failed',
                code='CONNECTION_ERROR',
                details={'error': str(e)}
            )
        except requests.exceptions.RequestException as e:
            raise NetworkError(
                message=f'Request failed: {str(e)}',
                code='REQUEST_ERROR',
                details={'error': str(e)}
            )` : ''}

    def ${functionName}_stream(
        self,
        input_data: PromptInput,
        on_chunk: Callable[[str], None]
    ) -> None:
        \"\"\"
        Execute the prompt with streaming response

        Args:
            input_data: Input parameters for the prompt
            on_chunk: Callback function for each chunk of data

        Raises:
            ValidationError: If input validation fails
            NetworkError: If network request fails
            APIError: If API returns an error
        \"\"\"
        ${options.includeErrorHandling ? 'self._validate_input(input_data)\n\n        try:' : ''}
        payload = {
            'prompt': '${config.id}',
            'variables': self._to_dict(input_data)
        }

        response = self.session.post(
            f'{self.base_url}/execute/stream',
            json=payload,
            timeout=self.timeout,
            stream=True
        )

        ${options.includeErrorHandling ? 'response.raise_for_status()\n\n        ' : ''}for chunk in response.iter_content(chunk_size=None):
            if chunk:
                on_chunk(chunk.decode('utf-8'))
        ${options.includeErrorHandling ? `
        except Exception as e:
            raise APIError(
                message=f'Stream failed: {str(e)}',
                code='STREAM_ERROR',
                details={'error': str(e)}
            )` : ''}

    def _validate_input(self, input_data: PromptInput) -> None:
        \"\"\"Validate input parameters\"\"\"
        ${config.variables.filter(v => v.required).map(v => `
        if input_data.${v.name} is None:
            raise ValidationError(
                message=f'Missing required parameter: ${v.name}',
                code='VALIDATION_ERROR',
                details={'parameter': '${v.name}'}
            )`).join('\n        ')}

    @staticmethod
    def _to_dict(obj: Any) -> Dict[str, Any]:
        \"\"\"Convert dataclass to dictionary\"\"\"
        if hasattr(obj, '__dict__'):
            return {k: v for k, v in obj.__dict__.items() if v is not None}
        return obj


def create_${toSnakeCase(className)}(
    api_key: str,
    **kwargs
) -> ${className}:
    \"\"\"
    Factory function to create a new client instance

    Args:
        api_key: Your PromptStudio API key
        **kwargs: Additional configuration options

    Returns:
        A new instance of ${className}
    \"\"\"
    return ${className}(api_key=api_key, **kwargs)`;
}

function mapTypeToPython(type: string): string {
  switch (type) {
    case 'string':
      return 'str';
    case 'number':
      return 'float';
    case 'boolean':
      return 'bool';
    case 'array':
      return 'List[Any]';
    case 'object':
      return 'Dict[str, Any]';
    default:
      return 'Any';
  }
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter, index) =>
    index === 0 ? letter.toLowerCase() : `_${letter.toLowerCase()}`
  );
}
