
import 'dotenv/config';

console.log("Checking Environment Variables...");
console.log("--------------------------------");

const keys = [
    "OPENAI_API_KEY",
    "GOOGLE_AI_API_KEY",
    "GROQ_API_KEY",
    "ANTHROPIC_API_KEY"
];

keys.forEach(key => {
    const value = process.env[key];
    if (!value) {
        console.log(`❌ ${key}: Not Set`);
    } else {
        // Show first 8 and last 4 chars
        const masked = value.length > 12
            ? `${value.substring(0, 8)}...${value.substring(value.length - 4)}`
            : "SET (Too short to mask safely)";
        console.log(`✅ ${key}: ${masked} (Length: ${value.length})`);
    }
});

console.log("--------------------------------");
console.log("If these values map to your OLD keys, you MUST restart the server.");
