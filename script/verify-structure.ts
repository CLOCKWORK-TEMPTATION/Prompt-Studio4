
import fs from 'fs';
import path from 'path';

const REQUIRED_DEPS = [
    '@anthropic-ai/sdk',
    '@google/generative-ai',
    'openai',
    'socket.io',
    'yjs'
];

const REQUIRED_TABLES = [
    'users',
    'tenants',
    'collaboration_sessions',
    'semantic_cache',
    'marketplace_prompts'
];

try {
    // Check package.json
    const pkgPath = path.resolve('package.json');
    if (!fs.existsSync(pkgPath)) {
        console.error("package.json not found");
        process.exit(1);
    }
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    const missingDeps = REQUIRED_DEPS.filter(d => !allDeps[d]);

    // Check schema.ts
    const schemaPath = path.resolve('shared/schema.ts');
    if (!fs.existsSync(schemaPath)) {
        console.error("shared/schema.ts not found");
        process.exit(1);
    }
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    const missingTables = REQUIRED_TABLES.filter(t => !schema.includes(`pgTable("${t}"`));

    console.log("Structure Verification Report:");
    console.log("------------------------------");
    if (missingDeps.length > 0) {
        console.log("Missing Dependencies:", missingDeps);
    } else {
        console.log("Dependencies: OK");
    }

    if (missingTables.length > 0) {
        console.log("Missing Tables:", missingTables);
    } else {
        console.log("Tables: OK");
    }

    if (missingDeps.length === 0 && missingTables.length === 0) {
        console.log("VERIFICATION PASSED");
        process.exit(0);
    } else {
        console.log("VERIFICATION FAILED");
        process.exit(1);
    }
} catch (error) {
    console.error("Error running verification:", error);
    process.exit(1);
}
