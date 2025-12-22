import type { Express } from "express";
import { z } from "zod";
import { SDKGenerator, SupportedLanguage } from "../lib/sdk-generator/advanced-index";
import { PromptConfig } from "../lib/sdk-generator/types";

// Validation schema for SDK generation request
const sdkGenerationSchema = z.object({
  promptConfig: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    prompt: z.string(),
    model: z.string(),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().positive(),
    topP: z.number().min(0).max(1),
    frequencyPenalty: z.number().min(0).max(2),
    presencePenalty: z.number().min(0).max(2),
    stopSequences: z.array(z.string()),
    variables: z.array(
      z.object({
        name: z.string(),
        type: z.enum(['string', 'number', 'boolean', 'array', 'object']),
        description: z.string(),
        required: z.boolean(),
        defaultValue: z.any().optional(),
      })
    ),
    createdAt: z.date().or(z.string().transform(str => new Date(str))),
    updatedAt: z.date().or(z.string().transform(str => new Date(str))),
  }),
  language: z.enum(['typescript', 'python', 'javascript', 'go', 'curl']),
  options: z
    .object({
      asyncMode: z.boolean().optional(),
      includeRetryLogic: z.boolean().optional(),
      includeErrorHandling: z.boolean().optional(),
      functionName: z.string().optional(),
      className: z.string().optional(),
      includeTypes: z.boolean().optional(),
      includeDocstrings: z.boolean().optional(),
      retryAttempts: z.number().optional(),
      retryDelay: z.number().optional(),
      timeout: z.number().optional(),
    })
    .optional(),
});

export function registerSDKRoutes(app: Express): void {
  /**
   * Generate SDK for a single language
   */
  app.post("/api/sdk/generate", async (req, res) => {
    try {
      const validated = sdkGenerationSchema.parse(req.body);

      const sdk = SDKGenerator.generate({
        promptConfig: validated.promptConfig,
        language: validated.language,
        options: validated.options,
      });

      res.json({
        success: true,
        sdk,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          details: error.errors,
        });
      }

      console.error("SDK generation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate SDK",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Generate complete SDK package with documentation
   */
  app.post("/api/sdk/generate-package", async (req, res) => {
    try {
      const validated = sdkGenerationSchema.parse(req.body);

      const pkg = SDKGenerator.generatePackage({
        promptConfig: validated.promptConfig,
        language: validated.language,
        options: validated.options,
      });

      res.json({
        success: true,
        package: pkg,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          details: error.errors,
        });
      }

      console.error("SDK package generation error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate SDK package",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Generate SDKs for all supported languages
   */
  app.post("/api/sdk/generate-all", async (req, res) => {
    try {
      const schema = z.object({
        promptConfig: sdkGenerationSchema.shape.promptConfig,
      });

      const validated = schema.parse(req.body);

      const packages = SDKGenerator.generateAll(validated.promptConfig);

      // Convert Map to object for JSON response
      const packagesObj: Record<string, any> = {};
      packages.forEach((pkg, lang) => {
        packagesObj[lang] = pkg;
      });

      res.json({
        success: true,
        packages: packagesObj,
        languages: Array.from(packages.keys()),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          details: error.errors,
        });
      }

      console.error("SDK generation (all) error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate SDKs",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  /**
   * Get supported languages
   */
  app.get("/api/sdk/languages", (_req, res) => {
    res.json({
      success: true,
      languages: ['typescript', 'python', 'javascript', 'go', 'curl'],
      features: {
        typescript: {
          async: true,
          retry: true,
          streaming: true,
          types: true,
          errorHandling: true,
        },
        python: {
          async: true,
          retry: true,
          streaming: true,
          types: true,
          errorHandling: true,
        },
        javascript: {
          async: true,
          retry: true,
          streaming: true,
          types: false,
          errorHandling: true,
        },
        go: {
          async: true,
          retry: true,
          streaming: true,
          types: true,
          errorHandling: true,
        },
        curl: {
          async: false,
          retry: true,
          streaming: true,
          types: false,
          errorHandling: true,
        },
      },
    });
  });

  /**
   * Download SDK as a file
   */
  app.post("/api/sdk/download", async (req, res) => {
    try {
      const validated = sdkGenerationSchema.parse(req.body);

      const pkg = SDKGenerator.generatePackage({
        promptConfig: validated.promptConfig,
        language: validated.language,
        options: validated.options,
      });

      // Set headers for file download
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${pkg.sdk.filename}"`
      );

      res.send(pkg.sdk.code);
      res.end();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          details: error.errors,
        });
      }

      console.error("SDK download error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to download SDK",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
}
