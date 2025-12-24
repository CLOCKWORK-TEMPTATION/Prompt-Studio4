import 'express-session';

declare module 'express-session' {
  interface SessionData {
    groqApiKey?: string;
    apiKey?: string;
    baseUrl?: string;
    defaultModel?: string;
    darkMode?: boolean;
    rtlMode?: boolean;
  }
}
