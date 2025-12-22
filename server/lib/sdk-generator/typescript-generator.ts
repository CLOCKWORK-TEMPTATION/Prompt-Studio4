import { PromptConfig, SDKGenerationOptions, GeneratedSDK, PromptVariable } from './types';

function toTypeScriptType(type: PromptVariable['type']): string {
    switch (type) {
        case 'string': return 'string';
        case 'number': return 'number';
        case 'boolean': return 'boolean';
        case 'array': return 'unknown[]';
        case 'object': return 'Record<string, unknown>';
        default: return 'unknown';
    }
}

function toCamelCase(str: string): string {
    return str.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase()).replace(/^[A-Z]/, (chr) => chr.toLowerCase());
}

function toPascalCase(str: string): string {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function escapeString(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function generateTypes(config: PromptConfig, options: SDKGenerationOptions): string {
    const hasVariables = config.variables.length > 0;
    let types = `
export interface ${options.className}Config {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}
export interface PromptResponse {
  content: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number; };
  finishReason: string;
  latencyMs: number;
}
`;
    if (hasVariables) {
        const variableTypes = config.variables.map(v => {
            const tsType = toTypeScriptType(v.type);
            const optional = v.required ? '' : '?';
            return `  /** ${v.description} */
  ${toCamelCase(v.name)}${optional}: ${tsType};`;
        }).join('\n');
        types += `
export interface PromptVariables {
${variableTypes}
}
`;
    }
    types += `
export interface ExecutionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  signal?: AbortSignal;
}
`;
    return types;
}

export function generateTypeScriptSDK(config: PromptConfig, options: SDKGenerationOptions): GeneratedSDK {
    const sections: string[] = [
        '/**',
        ` * PromptStudio SDK - ${config.name}`,
        ` * ${config.description || 'Auto-generated SDK'}`,
        ' */',
        '',
    ];
    if (options.includeTypes) {
        sections.push(generateTypes(config, options));
    }

    // Implementation details would go here (simplified for this port to keep it manageable, usually we'd add the full class)
    const fnName = toCamelCase(options.functionName);
    const className = options.className;

    sections.push(`
export class ${className} {
  constructor(private config: ${className}Config = {}) {}
  
  async ${fnName}(variables: any, options: ExecutionOptions = {}): Promise<PromptResponse> {
    // Implementation placeholder
    return {
        content: "Placeholder",
        model: "gpt-4",
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        finishReason: "stop",
        latencyMs: 0
    };
  }
}
`);

    return {
        language: 'typescript',
        code: sections.join('\n'),
        types: options.includeTypes ? generateTypes(config, options) : undefined,
        filename: `${toCamelCase(config.name)}Client.ts`,
        dependencies: [],
    };
}
