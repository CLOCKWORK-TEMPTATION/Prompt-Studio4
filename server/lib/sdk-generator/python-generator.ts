import { PromptConfig, SDKGenerationOptions, GeneratedSDK, PromptVariable } from './types';

function toPythonType(type: PromptVariable['type']): string {
    switch (type) {
        case 'string': return 'str';
        case 'number': return 'float';
        case 'boolean': return 'bool';
        case 'array': return 'List[Any]';
        case 'object': return 'Dict[str, Any]';
        default: return 'Any';
    }
}

function toSnakeCase(str: string): string {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '').replace(/[^a-z0-9_]/g, '_');
}

export function generatePythonSDK(config: PromptConfig, options: SDKGenerationOptions): GeneratedSDK {
    const fnName = toSnakeCase(options.functionName);
    const className = options.className;

    let code = `\"\"\"
PromptStudio SDK - ${config.name}
${config.description || 'Auto-generated SDK'}
\"\"\"
import os
from typing import Dict, List, Any, Optional

class ${className}:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")

    def ${fnName}(self, **kwargs):
        # Implementation placeholder
        pass
`;

    return {
        language: 'python',
        code,
        filename: `${toSnakeCase(config.name)}_client.py`,
        dependencies: ['requests'],
    };
}
