/**
 * Unified AI API Connectivity Validator (Full List Version)
 * Language: TypeScript
 * Architecture: Service-Oriented, OOP, Native HTTPS
 * Author: Engineering Assistant
 * Date: 2025-12-24
 */

import * as dotenv from "dotenv";
import * as https from "https";
import { IncomingMessage } from "http";

dotenv.config();

// --- 1. Infrastructure Layer: Logger ---
class Logger {
  static info(message: string): void {
    process.stdout.write(`[INFO] [${new Date().toISOString()}] ${message}\n`);
  }

  static error(message: string, errorDetails: string = ""): void {
    process.stderr.write(
      `[ERROR] [${new Date().toISOString()}] ${message} ${errorDetails}\n`,
    );
  }

  static separator(): void {
    process.stdout.write(
      "--------------------------------------------------\n",
    );
  }
}

// --- 2. Infrastructure Layer: Configuration ---
class ConfigManager {
  static getEnvVar(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Environment variable ${name} is missing.`);
    }
    return value;
  }

  static getGoogleKey(): string {
    return this.getEnvVar("GOOGLE_AI_API_KEY");
  }
  static getOpenAIKey(): string {
    return this.getEnvVar("OPENAI_API_KEY");
  }
}

// --- 3. Base Service Layer (Abstract) ---
abstract class BaseApiService {
  protected name: string;
  protected hostname: string;

  constructor(name: string, hostname: string) {
    this.name = name;
    this.hostname = hostname;
  }

  protected _maskKey(key: string): string {
    if (!key || key.length < 8) return "****";
    return `${key.substring(0, 8)}...${key.slice(-4)}`;
  }

  protected _handleErrorResponse(statusCode: number, data: string): void {
    let errorMessage = `Status: ${statusCode}`;
    try {
      const parsed = JSON.parse(data);
      const msg =
        parsed.error?.message || parsed.error || JSON.stringify(parsed);
      errorMessage += ` | Message: ${msg}`;
    } catch (e: any) {
      errorMessage += ` | Raw: ${data.substring(0, 100)}`;
    }
    Logger.error(`❌ ${this.name}: API Error. ${errorMessage}`);
  }

  protected async _performRequest(
    path: string,
    headers: Record<string, string>,
    timeoutMs: number = 10000,
  ): Promise<boolean> {
    const options: https.RequestOptions = {
      hostname: this.hostname,
      path: path,
      method: "GET",
      headers: headers,
      timeout: timeoutMs,
    };

    return new Promise<boolean>((resolve) => {
      const req = https.request(options, (res: IncomingMessage) => {
        let data = "";
        res.on("data", (chunk: Buffer) => (data += chunk.toString()));

        res.on("end", () => {
          if (res.statusCode === 200) {
            Logger.info(`✅ ${this.name}: Success! Key is valid.`);
            try {
              const parsed = JSON.parse(data);

              // Compatibility: OpenAI uses 'data', Google uses 'models'
              const list = parsed.data || parsed.models;

              if (Array.isArray(list)) {
                Logger.info(`   Real Available Models Count: ${list.length}`);
                // Optional: Uncomment next line to see IDs if needed
                // Logger.info(`   IDs: ${list.map((m: any) => m.id || m.name).slice(0, 5).join(', ')}...`);
              } else {
                Logger.info(`   Response parsed but no model list found.`);
              }
            } catch (e) {
              Logger.error(`   Failed to parse JSON response.`);
            }
            resolve(true);
          } else {
            this._handleErrorResponse(res.statusCode || 0, data);
            resolve(false);
          }
        });
      });

      req.on("timeout", () => {
        req.destroy();
        Logger.error(`❌ ${this.name}: Connection Timed Out.`);
        resolve(false);
      });

      req.on("error", (e: Error) => {
        Logger.error(`❌ ${this.name}: Network Error - ${e.message}`);
        resolve(false);
      });

      req.end();
    });
  }

  abstract verifyConnection(): Promise<boolean>;
}

// --- 4. Concrete Services ---

class OpenAIService extends BaseApiService {
  constructor() {
    super("OpenAI", "api.openai.com");
  }

  async verifyConnection(): Promise<boolean> {
    let apiKey: string;
    try {
      apiKey = ConfigManager.getOpenAIKey();
    } catch (e: unknown) {
      Logger.error(`❌ OpenAI: ${e instanceof Error ? e.message : String(e)}`);
      return false;
    }

    Logger.info(`Testing OpenAI Key (${this._maskKey(apiKey)})...`);

    // OpenAI: Returns full list by default
    return await this._performRequest("/v1/models", {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    });
  }
}

class GoogleGeminiService extends BaseApiService {
  constructor() {
    super("Google", "generativelanguage.googleapis.com");
  }

  async verifyConnection(): Promise<boolean> {
    let apiKey: string;
    try {
      apiKey = ConfigManager.getGoogleKey();
    } catch (e: unknown) {
      Logger.error(`❌ Google: ${e instanceof Error ? e.message : String(e)}`);
      return false;
    }

    Logger.info(`Testing Google Gemini Key (${this._maskKey(apiKey)})...`);

    // CORRECTION: Removed pageSize=1 to fetch ALL models
    const path = `/v1beta/models?key=${apiKey}`;

    return await this._performRequest(path, {
      "Content-Type": "application/json",
    });
  }
}

// --- 5. Execution Logic ---
async function run() {
  Logger.info("Starting System Diagnostics (Full List Mode)...");
  Logger.separator();

  const openAiService = new OpenAIService();
  await openAiService.verifyConnection();

  Logger.separator();

  const googleService = new GoogleGeminiService();
  await googleService.verifyConnection();

  Logger.separator();
  Logger.info("Diagnostics Complete.");
}

run().catch((err) => console.error("Fatal Error:", err));
