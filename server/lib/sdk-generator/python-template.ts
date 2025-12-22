import { PromptConfig, SDKGenerationOptions, GeneratedSDK } from './types';
import { renderTemplate } from './template-util';

const pyTemplate = `\"\"\"
Auto-generated SDK for PromptStudio
\"\"\"
import requests

def {{functionName}}(input_text: str, api_key: str) -> str:
    url = 'https://api.promptstudio.ai/v1/execute'
    headers = {'Authorization': f'Bearer {api_key}'}
    data = {'prompt': input_text}
    response = requests.post(url, json=data, headers=headers)
    return response.json().get('result', '')
`;

export function generatePythonSDKTemplate(_promptConfig: PromptConfig, options: SDKGenerationOptions): GeneratedSDK {
  const code = renderTemplate(pyTemplate, {
    functionName: options.functionName || 'generate_response',
  });
  return {
    language: 'python',
    code,
    filename: `${options.functionName || 'generate_response'}.py`,
    dependencies: ['requests'],
  };
}
