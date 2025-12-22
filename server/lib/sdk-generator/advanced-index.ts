import { PromptConfig, SDKGenerationOptions, GeneratedSDK } from './types';
import { generateAdvancedTypeScriptSDK } from './advanced-typescript-generator';
import { generateAdvancedPythonSDK } from './advanced-python-generator';
import { generateJavaScriptSDK } from './javascript-generator';
import { generateGoSDK } from './go-generator';
import { generateCurlSDK } from './curl-generator';

export type SupportedLanguage = 'typescript' | 'python' | 'javascript' | 'go' | 'curl';

export interface SDKGenerationRequest {
  promptConfig: PromptConfig;
  language: SupportedLanguage;
  options?: Partial<SDKGenerationOptions>;
}

export interface SDKPackage {
  sdk: GeneratedSDK;
  readme: string;
  packageInfo?: {
    name: string;
    version: string;
    description: string;
    author?: string;
    license?: string;
  };
  examples?: string;
}

/**
 * Main SDK Generator
 * Generates production-ready SDKs for multiple languages
 */
export class SDKGenerator {
  /**
   * Generate SDK for a specific language
   */
  static generate(request: SDKGenerationRequest): GeneratedSDK {
    const options = this.getDefaultOptions(request.language, request.options);

    switch (request.language) {
      case 'typescript':
        return generateAdvancedTypeScriptSDK(request.promptConfig, options);
      case 'python':
        return generateAdvancedPythonSDK(request.promptConfig, options);
      case 'javascript':
        return generateJavaScriptSDK(request.promptConfig, options);
      case 'go':
        return generateGoSDK(request.promptConfig, options);
      case 'curl':
        return generateCurlSDK(request.promptConfig, options);
      default:
        throw new Error(`Unsupported language: ${request.language}`);
    }
  }

  /**
   * Generate complete SDK package with documentation
   */
  static generatePackage(request: SDKGenerationRequest): SDKPackage {
    const sdk = this.generate(request);
    const readme = this.generateReadme(request.promptConfig, request.language, sdk);
    const examples = this.generateExamples(request.promptConfig, request.language);
    const packageInfo = this.generatePackageInfo(request.promptConfig, request.language);

    return {
      sdk,
      readme,
      packageInfo,
      examples,
    };
  }

  /**
   * Generate SDKs for all supported languages
   */
  static generateAll(promptConfig: PromptConfig): Map<SupportedLanguage, SDKPackage> {
    const languages: SupportedLanguage[] = ['typescript', 'python', 'javascript', 'go', 'curl'];
    const packages = new Map<SupportedLanguage, SDKPackage>();

    for (const language of languages) {
      try {
        const pkg = this.generatePackage({ promptConfig, language });
        packages.set(language, pkg);
      } catch (error) {
        console.error(`Failed to generate SDK for ${language}:`, error);
      }
    }

    return packages;
  }

  /**
   * Get default options for a language
   */
  private static getDefaultOptions(
    language: SupportedLanguage,
    overrides?: Partial<SDKGenerationOptions>
  ): SDKGenerationOptions {
    const baseOptions: SDKGenerationOptions = {
      language: language as any,
      asyncMode: true,
      includeRetryLogic: true,
      includeErrorHandling: true,
      functionName: language === 'python' ? 'execute' : 'execute',
      className: 'PromptClient',
      includeTypes: true,
      includeDocstrings: true,
      retryAttempts: 3,
      retryDelay: 1000,
      timeout: 30000,
    };

    return { ...baseOptions, ...overrides };
  }

  /**
   * Generate README documentation
   */
  private static generateReadme(
    config: PromptConfig,
    language: SupportedLanguage,
    sdk: GeneratedSDK
  ): string {
    const installationInstructions = this.getInstallationInstructions(language, sdk.dependencies);
    const usageExample = this.getUsageExample(language, config);

    return `# ${config.name} SDK

${config.description}

## Installation

${installationInstructions}

## Quick Start

${usageExample}

## Configuration

### API Key

Get your API key from the PromptStudio dashboard:

\`\`\`
https://promptstudio.ai/dashboard/api-keys
\`\`\`

### Environment Variables

${language === 'curl' ? `
\`\`\`bash
export PROMPTSTUDIO_API_KEY="your-api-key-here"
\`\`\`
` : `
\`\`\`bash
export PROMPTSTUDIO_API_KEY="your-api-key-here"
\`\`\`

Or pass it directly to the client constructor.
`}

## API Reference

### Input Parameters

${config.variables.map(v => `
- **${v.name}** (${v.type})${v.required ? ' *required*' : ' *optional*'}
  - ${v.description}
  ${v.defaultValue !== undefined ? `- Default: \`${JSON.stringify(v.defaultValue)}\`` : ''}
`).join('\n')}

### Response

The API returns a response object with:

- **result** (string): The generated text
- **metadata** (object, optional): Metadata about the generation
  - **model** (string): The model used
  - **tokens** (object): Token usage information
    - **prompt** (number): Tokens in the prompt
    - **completion** (number): Tokens in the completion
    - **total** (number): Total tokens used
  - **latency** (number): Request latency in milliseconds

## Error Handling

All SDK methods can throw errors. Make sure to wrap calls in try-catch blocks:

${this.getErrorHandlingExample(language)}

## Advanced Features

### Streaming

For long-running requests, use the streaming API:

${this.getStreamingExample(language, config)}

### Retry Logic

The SDK includes built-in retry logic with exponential backoff. Configure it:

${this.getRetryConfigExample(language)}

### Timeout

Configure request timeout (default: 30 seconds):

${this.getTimeoutExample(language)}

## Examples

See the \`examples/\` directory for more usage examples.

## Support

For issues or questions:
- GitHub: https://github.com/promptstudio/sdk
- Email: support@promptstudio.ai
- Docs: https://docs.promptstudio.ai

## License

MIT License - see LICENSE file for details.

## Generated SDK

This SDK was auto-generated on ${new Date().toISOString()}.
`;
  }

  /**
   * Get installation instructions for a language
   */
  private static getInstallationInstructions(
    language: SupportedLanguage,
    dependencies: string[]
  ): string {
    switch (language) {
      case 'typescript':
        return `\`\`\`bash
npm install ${dependencies.join(' ')}
\`\`\`

Or with yarn:

\`\`\`bash
yarn add ${dependencies.join(' ')}
\`\`\``;

      case 'python':
        return `\`\`\`bash
pip install ${dependencies.join(' ')}
\`\`\`

Or add to your \`requirements.txt\`:

\`\`\`
${dependencies.join('\n')}
\`\`\``;

      case 'javascript':
        return `\`\`\`bash
npm install ${dependencies.join(' ')}
\`\`\``;

      case 'go':
        return `\`\`\`bash
go get ${dependencies.join(' ')}
\`\`\``;

      case 'curl':
        return `\`\`\`bash
# Ensure curl and jq are installed
# macOS:
brew install curl jq

# Ubuntu/Debian:
sudo apt-get install curl jq
\`\`\``;

      default:
        return 'Installation instructions not available';
    }
  }

  /**
   * Get usage example for a language
   */
  private static getUsageExample(language: SupportedLanguage, config: PromptConfig): string {
    const exampleInput = this.generateExampleInput(config);

    switch (language) {
      case 'typescript':
        return `\`\`\`typescript
import { createPromptClient } from './PromptClient';

const client = createPromptClient('your-api-key');

const result = await client.execute(${exampleInput});
console.log(result.result);
\`\`\``;

      case 'python':
        return `\`\`\`python
from promptclient import create_prompt_client, PromptInput

client = create_prompt_client(api_key="your-api-key")

result = client.execute(PromptInput(${this.formatPythonInput(config)}))
print(result.result)
\`\`\``;

      case 'javascript':
        return `\`\`\`javascript
const { createPromptClient } = require('./PromptClient');

const client = createPromptClient('your-api-key');

const result = await client.execute(${exampleInput});
console.log(result.result);
\`\`\``;

      case 'go':
        return `\`\`\`go
package main

import (
    "fmt"
    "log"
    "promptclient"
)

func main() {
    client := promptclient.NewClient("your-api-key")

    result, err := client.Execute(promptclient.PromptInput{${this.formatGoInput(config)}})
    if err != nil {
        log.Fatal(err)
    }

    fmt.Println(result.Result)
}
\`\`\``;

      case 'curl':
        return `\`\`\`bash
export PROMPTSTUDIO_API_KEY="your-api-key"
source api-examples.sh

execute_prompt '${exampleInput}'
\`\`\``;

      default:
        return 'Usage example not available';
    }
  }

  /**
   * Generate example input for documentation
   */
  private static generateExampleInput(config: PromptConfig): string {
    if (config.variables.length === 0) {
      return '{}';
    }

    const example: Record<string, any> = {};
    config.variables.forEach(v => {
      example[v.name] = v.defaultValue || this.getExampleValue(v.type, v.description);
    });

    return JSON.stringify(example, null, 2);
  }

  private static formatPythonInput(config: PromptConfig): string {
    return config.variables
      .map(v => `${v.name}=${JSON.stringify(v.defaultValue || this.getExampleValue(v.type, v.description))}`)
      .join(', ');
  }

  private static formatGoInput(config: PromptConfig): string {
    return config.variables
      .map(v => {
        const name = v.name.charAt(0).toUpperCase() + v.name.slice(1);
        return `${name}: ${JSON.stringify(v.defaultValue || this.getExampleValue(v.type, v.description))}`;
      })
      .join(',\n        ');
  }

  private static getExampleValue(type: string, description: string): any {
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

  private static getErrorHandlingExample(language: SupportedLanguage): string {
    // Implementation for error handling examples
    return `See SDK documentation for error handling examples in ${language}.`;
  }

  private static getStreamingExample(language: SupportedLanguage, config: PromptConfig): string {
    // Implementation for streaming examples
    return `See SDK documentation for streaming examples in ${language}.`;
  }

  private static getRetryConfigExample(language: SupportedLanguage): string {
    // Implementation for retry config examples
    return `See SDK documentation for retry configuration in ${language}.`;
  }

  private static getTimeoutExample(language: SupportedLanguage): string {
    // Implementation for timeout examples
    return `See SDK documentation for timeout configuration in ${language}.`;
  }

  /**
   * Generate usage examples
   */
  private static generateExamples(config: PromptConfig, language: SupportedLanguage): string {
    return `# Examples for ${config.name} SDK (${language})

See README.md for usage instructions.
`;
  }

  /**
   * Generate package metadata
   */
  private static generatePackageInfo(config: PromptConfig, language: SupportedLanguage) {
    return {
      name: `promptstudio-${config.id}-${language}`,
      version: '1.0.0',
      description: config.description,
      author: 'PromptStudio',
      license: 'MIT',
    };
  }
}

export {
  generateAdvancedTypeScriptSDK,
  generateAdvancedPythonSDK,
  generateJavaScriptSDK,
  generateGoSDK,
  generateCurlSDK,
};
