import { PromptConfig, SDKGenerationOptions, GeneratedSDK } from './types';

/**
 * cURL Commands Generator
 */
export function generateCurlSDK(
  promptConfig: PromptConfig,
  options: SDKGenerationOptions
): GeneratedSDK {
  const code = generateCurlCommands(promptConfig, options);

  return {
    language: 'curl' as any,
    code,
    filename: 'api-examples.sh',
    dependencies: ['curl', 'jq'],
  };
}

function generateCurlCommands(config: PromptConfig, options: SDKGenerationOptions): string {
  const basicExample = generateBasicCurl(config);
  const advancedExample = generateAdvancedCurl(config, options);
  const streamingExample = generateStreamingCurl(config);
  const bashScript = generateBashScript(config, options);

  return `#!/bin/bash

# Auto-generated cURL examples for ${config.name}
# ${config.description}
#
# Generated: ${new Date().toISOString()}
# Version: 1.0.0

# ==============================================================================
# BASIC EXAMPLE
# ==============================================================================

${basicExample}

# ==============================================================================
# ADVANCED EXAMPLE WITH ERROR HANDLING
# ==============================================================================

${advancedExample}

# ==============================================================================
# STREAMING EXAMPLE
# ==============================================================================

${streamingExample}

# ==============================================================================
# BASH FUNCTION WRAPPER
# ==============================================================================

${bashScript}

# ==============================================================================
# USAGE EXAMPLES
# ==============================================================================

# Example 1: Basic usage
# export PROMPTSTUDIO_API_KEY="your-api-key-here"
# ${options.functionName || 'execute_prompt'} '${generateExampleInput(config)}'

# Example 2: With custom base URL
# ${options.functionName || 'execute_prompt'} '${generateExampleInput(config)}' "https://custom.api.com/v1"

# Example 3: Parse specific field from response
# RESULT=\$(${options.functionName || 'execute_prompt'} '${generateExampleInput(config)}' | jq -r '.result')
# echo "Result: $RESULT"`;
}

function generateBasicCurl(config: PromptConfig): string {
  return `# Basic cURL request
curl -X POST https://api.promptstudio.ai/v1/execute \\
  -H "Authorization: Bearer \${PROMPTSTUDIO_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "${config.id}",
    "variables": ${generateExampleInput(config)},
    "config": {
      "model": "${config.model}",
      "temperature": ${config.temperature},
      "max_tokens": ${config.maxTokens},
      "top_p": ${config.topP},
      "frequency_penalty": ${config.frequencyPenalty},
      "presence_penalty": ${config.presencePenalty}${config.stopSequences.length > 0 ? `,\n      "stop": ${JSON.stringify(config.stopSequences)}` : ''}
    }
  }'`;
}

function generateAdvancedCurl(config: PromptConfig, options: SDKGenerationOptions): string {
  return `# Advanced cURL with error handling and response parsing
execute_request() {
  local response
  local http_code

  # Make request and capture both response and HTTP code
  response=\$(curl -s -w "\\n%{http_code}" \\
    -X POST https://api.promptstudio.ai/v1/execute \\
    -H "Authorization: Bearer \${PROMPTSTUDIO_API_KEY}" \\
    -H "Content-Type: application/json" \\
    ${options.timeout ? `-m ${options.timeout / 1000}` : ''} \\
    -d '{
      "prompt": "${config.id}",
      "variables": ${generateExampleInput(config)},
      "config": {
        "model": "${config.model}",
        "temperature": ${config.temperature},
        "max_tokens": ${config.maxTokens}
      }
    }')

  http_code=\$(echo "$response" | tail -n1)
  response=\$(echo "$response" | sed '$ d')

  # Check HTTP status code
  if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
    echo "$response" | jq '.'
  else
    echo "Error: HTTP $http_code" >&2
    echo "$response" | jq '.message // .error // .' >&2
    return 1
  fi
}

# Call the function
# execute_request`;
}

function generateStreamingCurl(config: PromptConfig): string {
  return `# Streaming request
curl -N -X POST https://api.promptstudio.ai/v1/execute/stream \\
  -H "Authorization: Bearer \${PROMPTSTUDIO_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "${config.id}",
    "variables": ${generateExampleInput(config)}
  }' \\
  | while IFS= read -r line; do
      echo "Chunk: $line"
    done`;
}

function generateBashScript(config: PromptConfig, options: SDKGenerationOptions): string {
  const functionName = options.functionName || 'execute_prompt';

  return `# Reusable bash function
${functionName}() {
  local input_json="\$1"
  local base_url="\${2:-https://api.promptstudio.ai/v1}"
  local api_key="\${PROMPTSTUDIO_API_KEY}"

  if [[ -z "$api_key" ]]; then
    echo "Error: PROMPTSTUDIO_API_KEY environment variable is not set" >&2
    echo "Usage: export PROMPTSTUDIO_API_KEY='your-api-key'" >&2
    return 1
  fi

  ${options.includeErrorHandling ? `# Validate required parameters
${config.variables.filter(v => v.required).map(v => `  if ! echo "$input_json" | jq -e '.${v.name}' > /dev/null; then
    echo "Error: Missing required parameter: ${v.name}" >&2
    return 1
  fi`).join('\n')}

  ` : ''}local response
  local http_code
  local attempt=0
  local max_retries=${options.retryAttempts}
  local retry_delay=${options.retryDelay / 1000}

  while [[ $attempt -le $max_retries ]]; do
    # Make the request
    response=\$(curl -s -w "\\n%{http_code}" \\
      -X POST "$base_url/execute" \\
      -H "Authorization: Bearer $api_key" \\
      -H "Content-Type: application/json" \\
      ${options.timeout ? `-m ${options.timeout / 1000}` : ''} \\
      -d "{
        \\"prompt\\": \\"${config.id}\\",
        \\"variables\\": $input_json,
        \\"config\\": {
          \\"model\\": \\"${config.model}\\",
          \\"temperature\\": ${config.temperature},
          \\"max_tokens\\": ${config.maxTokens},
          \\"top_p\\": ${config.topP},
          \\"frequency_penalty\\": ${config.frequencyPenalty},
          \\"presence_penalty\\": ${config.presencePenalty}
        }
      }")

    http_code=\$(echo "$response" | tail -n1)
    response=\$(echo "$response" | sed '$ d')

    # Check for success
    if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
      echo "$response"
      return 0
    fi

    # Check if we should retry (5xx errors)
    if [[ "$http_code" -ge 500 && $attempt -lt $max_retries ]]; then
      echo "Retry attempt $((attempt + 1))/$max_retries after error $http_code" >&2
      sleep $((retry_delay * (2 ** attempt)))
      attempt=$((attempt + 1))
      continue
    fi

    # Non-retryable error
    echo "Error: HTTP $http_code" >&2
    echo "$response" | jq -r '.message // .error // .' >&2
    return 1
  done

  echo "Error: Max retries exceeded" >&2
  return 1
}`;
}

function generateExampleInput(config: PromptConfig): string {
  if (config.variables.length === 0) {
    return '{}';
  }

  const example: Record<string, any> = {};
  config.variables.forEach(v => {
    example[v.name] = v.defaultValue || getExampleValue(v.type, v.description);
  });

  return JSON.stringify(example, null, 2).split('\n').map((line, i) => i === 0 ? line : '      ' + line).join('\n');
}

function getExampleValue(type: string, description: string): any {
  switch (type) {
    case 'string':
      return description.toLowerCase().includes('email') ? 'user@example.com' :
             description.toLowerCase().includes('name') ? 'John Doe' :
             'example text';
    case 'number':
      return 42;
    case 'boolean':
      return true;
    case 'array':
      return ['item1', 'item2'];
    case 'object':
      return { key: 'value' };
    default:
      return null;
  }
}
