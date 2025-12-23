import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';
import { createServer } from 'http';

// Mock dependencies
jest.mock('../storage', () => ({
  storage: {
    getAllScenarios: jest.fn(),
    getScenarioById: jest.fn(),
    createScenario: jest.fn(),
    deleteScenario: jest.fn(),
    updateScenario: jest.fn(),
    getAllTemplates: jest.fn(),
    searchTemplates: jest.fn(),
    getAllTechniques: jest.fn(),
    getTechniqueById: jest.fn(),
    createTechnique: jest.fn(),
    updateTechnique: jest.fn(),
    deleteTechnique: jest.fn(),
    getAllRuns: jest.fn(),
    getRunById: jest.fn(),
    getRatingByRunId: jest.fn(),
    createRunRating: jest.fn(),
    updateRunRating: jest.fn(),
    createAgentComposeRun: jest.fn(),
    updateAgentComposeRun: jest.fn(),
    getAgentComposeRunById: jest.fn(),
    getAgentComposeResultByRunId: jest.fn(),
    createAgentComposeResult: jest.fn(),
    // Add other methods as needed by routes
  },
}));

jest.mock('../llm-provider', () => ({
  llmProvider: {
    complete: jest.fn(),
    critique: jest.fn(),
  },
}));

jest.mock('../agents', () => ({
  runAgent1: jest.fn(),
  runAgent2: jest.fn(),
  runAgent3: jest.fn(),
}));

jest.mock('../services/SemanticCacheService', () => ({
  semanticCacheService: {
    lookup: jest.fn(),
    store: jest.fn(),
    getConfig: jest.fn(),
    updateConfig: jest.fn(),
    getAnalytics: jest.fn(),
    invalidate: jest.fn(),
  },
}));

jest.mock('../services/CacheCleanupScheduler', () => ({
  cacheCleanupScheduler: {
    triggerManualCleanup: jest.fn(),
    getStatus: jest.fn(),
    updateConfig: jest.fn(),
  },
}));

jest.mock('../routes/sdk', () => ({
  registerSDKRoutes: jest.fn(),
}));

jest.mock('../lib/sdk-generator/advanced-index', () => ({
  SDKGenerator: {
    generate: jest.fn(),
  },
}));

jest.mock('../lib/sdk-generator/__tests__/runtime-tester', () => ({
  runtimeTester: {
    testSDK: jest.fn(),
  },
}));

describe('Scenarios API', () => {
  let app: express.Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    // Mock session
    app.use((req: any, res, next) => {
      req.session = {};
      next();
    });
    server = createServer(app);
    await registerRoutes(server, app);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/scenarios', () => {
    it('should return empty list when no scenarios exist', async () => {
      (storage.getAllScenarios as jest.Mock).mockResolvedValue([]);
      const res = await request(app).get('/api/scenarios');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return scenarios list', async () => {
      const mockScenarios = [
        { id: 1, title: 'Test Scenario', status: 'pending', progress: 0 }
      ];
      (storage.getAllScenarios as jest.Mock).mockResolvedValue(mockScenarios);
      const res = await request(app).get('/api/scenarios');
      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockScenarios);
    });
  });

  describe('POST /api/scenarios', () => {
    it('should create a new scenario', async () => {
      const newScenario = {
        title: 'New Scenario',
        description: 'Description',
        content: { tests: [] }
      };
      const createdScenario = { ...newScenario, id: 1, status: 'pending', progress: 0 };

      (storage.createScenario as jest.Mock).mockResolvedValue(createdScenario);

      const res = await request(app)
        .post('/api/scenarios')
        .send(newScenario);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(createdScenario);
      expect(storage.createScenario).toHaveBeenCalledWith(newScenario);
    });

    it('should return 400 for invalid input', async () => {
      const invalidScenario = { title: '' }; // Missing content

      const res = await request(app)
        .post('/api/scenarios')
        .send(invalidScenario);

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/scenarios/:id/run', () => {
    it('should start a scenario run', async () => {
      const scenario = { id: 1, status: 'pending' };
      (storage.getScenarioById as jest.Mock).mockResolvedValue(scenario);
      (storage.updateScenario as jest.Mock).mockResolvedValue({ ...scenario, status: 'running' });

      const res = await request(app).post('/api/scenarios/1/run');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Scenario started' });
      expect(storage.updateScenario).toHaveBeenCalledWith(1, { status: 'running', progress: 0 });
    });

    it('should return 404 if scenario not found', async () => {
      (storage.getScenarioById as jest.Mock).mockResolvedValue(undefined);

      const res = await request(app).post('/api/scenarios/999/run');

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/scenarios/:id/export', () => {
    it('should export scenario report', async () => {
      const scenario = { id: 1, title: 'Test', status: 'completed', result: { success: true } };
      (storage.getScenarioById as jest.Mock).mockResolvedValue(scenario);

      const res = await request(app).get('/api/scenarios/1/export');

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('application/json');
      expect(res.header['content-disposition']).toContain('attachment; filename="scenario_1_report.json"');
      expect(res.body).toEqual({
        id: 1,
        title: 'Test',
        status: 'completed',
        result: { success: true },
        exportedAt: expect.any(String)
      });
    });

    it('should return 404 if scenario not found', async () => {
      (storage.getScenarioById as jest.Mock).mockResolvedValue(undefined);
      const res = await request(app).get('/api/scenarios/999/export');
      expect(res.status).toBe(404);
    });
  });
});
