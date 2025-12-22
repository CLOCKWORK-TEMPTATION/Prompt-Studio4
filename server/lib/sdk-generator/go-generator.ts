import { PromptConfig, SDKGenerationOptions, GeneratedSDK } from './types';

/**
 * Go SDK Generator
 */
export function generateGoSDK(
  promptConfig: PromptConfig,
  options: SDKGenerationOptions
): GeneratedSDK {
  const code = generateGoCode(promptConfig, options);

  return {
    language: 'typescript', // Reusing for compatibility
    code,
    filename: 'promptclient.go',
    dependencies: ['encoding/json', 'net/http', 'time', 'bytes', 'errors'],
  };
}

function generateGoCode(config: PromptConfig, options: SDKGenerationOptions): string {
  const packageName = toSnakeCase(options.className || 'promptclient');
  const structFields = config.variables.map(v => {
    const jsonTag = v.required ? `json:"${v.name}"` : `json:"${v.name},omitempty"`;
    return `\t${capitalize(v.name)} ${mapTypeToGo(v.type)} \`${jsonTag}\``;
  }).join('\n');

  const validationCode = config.variables
    .filter(v => v.required)
    .map(v => `\tif input.${capitalize(v.name)} == ${getZeroValue(v.type)} {
\t\treturn &PromptError{
\t\t\tCode:    "VALIDATION_ERROR",
\t\t\tMessage: "Missing required parameter: ${v.name}",
\t\t\tDetails: map[string]string{"parameter": "${v.name}"},
\t\t}
\t}`)
    .join('\n');

  const stopSequencesCode = config.stopSequences.length > 0
    ? `\t\t\t"stop": []string{${config.stopSequences.map(s => `"${s}"`).join(', ')}},`
    : '';

  return `// Auto-generated SDK for ${config.name}
// ${config.description}
//
// Generated: ${new Date().toISOString()}
// Version: 1.0.0

package ${packageName}

import (
\t"bytes"
\t"encoding/json"
\t"errors"
\t"fmt"
\t"io"
\t"net/http"
\t"time"
)

// PromptInput represents the input parameters for ${config.name}
type PromptInput struct {
${structFields || '\t// No variables defined'}
}

// TokenUsage represents token usage information
type TokenUsage struct {
\tPrompt     int \`json:"prompt"\`
\tCompletion int \`json:"completion"\`
\tTotal      int \`json:"total"\`
}

// ResponseMetadata contains metadata about the response
type ResponseMetadata struct {
\tModel   string      \`json:"model"\`
\tTokens  TokenUsage  \`json:"tokens"\`
\tLatency float64     \`json:"latency"\`
}

// PromptResponse represents the API response
type PromptResponse struct {
\tResult   string            \`json:"result"\`
\tMetadata *ResponseMetadata \`json:"metadata,omitempty"\`
}

// PromptError represents an error from the API
type PromptError struct {
\tCode    string      \`json:"code"\`
\tMessage string      \`json:"message"\`
\tDetails interface{} \`json:"details,omitempty"\`
}

func (e *PromptError) Error() string {
\treturn fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// ClientConfig holds configuration for the client
type ClientConfig struct {
\tAPIKey     string
\tBaseURL    string
\tTimeout    time.Duration
\tMaxRetries int
\tRetryDelay time.Duration
}

// Client is the main client for ${config.name}
type Client struct {
\tconfig     ClientConfig
\thttpClient *http.Client
}

// NewClient creates a new PromptStudio client
func NewClient(apiKey string, opts ...func(*ClientConfig)) *Client {
\tconfig := ClientConfig{
\t\tAPIKey:     apiKey,
\t\tBaseURL:    "https://api.promptstudio.ai/v1",
\t\tTimeout:    ${options.timeout} * time.Millisecond,
\t\tMaxRetries: ${options.retryAttempts},
\t\tRetryDelay: ${options.retryDelay} * time.Millisecond,
\t}

\tfor _, opt := range opts {
\t\topt(&config)
\t}

\treturn &Client{
\t\tconfig: config,
\t\thttpClient: &http.Client{
\t\t\tTimeout: config.Timeout,
\t\t},
\t}
}

// Execute executes the prompt with the given input
func (c *Client) Execute(input PromptInput) (*PromptResponse, error) {
\t// Prepare request payload
\tpayload := map[string]interface{}{
\t\t"prompt": "${config.id}",
\t\t"variables": input,
\t\t"config": map[string]interface{}{
\t\t\t"model":             "${config.model}",
\t\t\t"temperature":       ${config.temperature},
\t\t\t"max_tokens":        ${config.maxTokens},
\t\t\t"top_p":             ${config.topP},
\t\t\t"frequency_penalty": ${config.frequencyPenalty},
\t\t\t"presence_penalty":  ${config.presencePenalty},
${stopSequencesCode}
\t\t},
\t}

\tpayloadBytes, err := json.Marshal(payload)
\tif err != nil {
\t\treturn nil, fmt.Errorf("failed to marshal payload: %w", err)
\t}

\treq, err := http.NewRequest("POST", c.config.BaseURL+"/execute", bytes.NewReader(payloadBytes))
\tif err != nil {
\t\treturn nil, fmt.Errorf("failed to create request: %w", err)
\t}

\treq.Header.Set("Authorization", "Bearer "+c.config.APIKey)
\treq.Header.Set("Content-Type", "application/json")

\tresp, err := c.httpClient.Do(req)
\tif err != nil {
\t\treturn nil, fmt.Errorf("request failed: %w", err)
\t}
\tdefer resp.Body.Close()

\t// Handle error responses
\tif resp.StatusCode >= 400 {
\t\tvar apiErr PromptError
\t\tif err := json.NewDecoder(resp.Body).Decode(&apiErr); err != nil {
\t\t\treturn nil, fmt.Errorf("API error (status %d): failed to decode error", resp.StatusCode)
\t\t}
\t\treturn nil, &apiErr
\t}

\t// Parse response
\tvar response PromptResponse
\tif err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
\t\treturn nil, fmt.Errorf("failed to decode response: %w", err)
\t}

\treturn &response, nil
}

// validateInput validates the input parameters
func (c *Client) validateInput(input *PromptInput) error {
${validationCode}
${validationCode ? '\n' : ''}\treturn nil
}`;
}

function mapTypeToGo(type: string): string {
  switch (type) {
    case 'string':
      return 'string';
    case 'number':
      return 'float64';
    case 'boolean':
      return 'bool';
    case 'array':
      return '[]interface{}';
    case 'object':
      return 'map[string]interface{}';
    default:
      return 'interface{}';
  }
}

function getZeroValue(type: string): string {
  switch (type) {
    case 'string':
      return '""';
    case 'number':
      return '0';
    case 'boolean':
      return 'false';
    default:
      return 'nil';
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter, index) =>
    index === 0 ? letter.toLowerCase() : '_' + letter.toLowerCase()
  );
}
