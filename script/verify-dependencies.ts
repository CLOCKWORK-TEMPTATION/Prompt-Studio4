
import fs from 'fs';
import path from 'path';

const REQUIRED_DEPS = [
    '@anthropic-ai/sdk',
    '@google/generative-ai',
    'openai',
    'socket.io',
    'yjs',
    'monaco-editor',
    'reactflow'
];

console.log("Verifying Dependencies...");

try {
    const pkgPath = path.resolve('package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

    const missing = REQUIRED_DEPS.filter(d => !allDeps[d]);

    if (missing.length > 0) {
        console.error("❌ Missing dependencies in package.json:", missing);
        process.exit(1);
    }

    console.log("✅ package.json contains all required dependencies.");

    // Check if they are actually installed (node_modules)
    const missingInstall = REQUIRED_DEPS.filter(d => {
        try {
            require.resolve(d);
            return false;
        } catch (e) {
            // Some packages might not be resolvable simply by name or require ESM
            // So we check basic node_modules existence for a quick check
            return !fs.existsSync(path.resolve('node_modules', d)) &&
                !fs.existsSync(path.resolve('node_modules', ...d.split('/')));
        }
    });

    if (missingInstall.length > 0) {
        console.warn("⚠️  Some dependencies might not be installed yet (run npm install):", missingInstall);
        // We don't fail here because we might need to run install next
    } else {
        console.log("✅ Dependencies appear to be installed.");
    }

    process.exit(0);
} catch (error) {
    console.error("Error verifying dependencies:", error);
    process.exit(1);
}
