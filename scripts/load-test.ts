/**
 * Load Testing Script for Prompt Studio API
 *
 * Usage:
 *   npx tsx scripts/load-test.ts [options]
 *
 * Options:
 *   --url          Base URL (default: http://localhost:3001)
 *   --concurrent   Number of concurrent requests (default: 10)
 *   --duration     Test duration in seconds (default: 30)
 *   --rps          Target requests per second (default: 50)
 */

interface LoadTestConfig {
  baseUrl: string;
  concurrentUsers: number;
  durationSeconds: number;
  targetRPS: number;
}

interface RequestResult {
  endpoint: string;
  method: string;
  status: number;
  latency: number;
  success: boolean;
  error?: string;
}

interface LoadTestResults {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  maxLatency: number;
  minLatency: number;
  requestsPerSecond: number;
  durationSeconds: number;
  endpointStats: Record<string, {
    count: number;
    avgLatency: number;
    errorRate: number;
  }>;
}

// Test endpoints configuration
const testEndpoints = [
  { method: 'GET', path: '/api/health', weight: 20 },
  { method: 'GET', path: '/api/templates', weight: 30 },
  { method: 'GET', path: '/api/techniques', weight: 20 },
  { method: 'GET', path: '/api/runs?limit=10', weight: 15 },
  { method: 'GET', path: '/api/cache/analytics', weight: 10 },
  { method: 'GET', path: '/api/monitoring/metrics', weight: 5 },
];

// Parse command line arguments
function parseArgs(): LoadTestConfig {
  const args = process.argv.slice(2);
  const config: LoadTestConfig = {
    baseUrl: 'http://localhost:3001',
    concurrentUsers: 10,
    durationSeconds: 30,
    targetRPS: 50,
  };

  for (let i = 0; i < args.length; i += 2) {
    switch (args[i]) {
      case '--url':
        config.baseUrl = args[i + 1];
        break;
      case '--concurrent':
        config.concurrentUsers = parseInt(args[i + 1], 10);
        break;
      case '--duration':
        config.durationSeconds = parseInt(args[i + 1], 10);
        break;
      case '--rps':
        config.targetRPS = parseInt(args[i + 1], 10);
        break;
    }
  }

  return config;
}

// Select random endpoint based on weight
function selectEndpoint(): { method: string; path: string } {
  const totalWeight = testEndpoints.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;

  for (const endpoint of testEndpoints) {
    random -= endpoint.weight;
    if (random <= 0) {
      return { method: endpoint.method, path: endpoint.path };
    }
  }

  return testEndpoints[0];
}

// Make a single request
async function makeRequest(baseUrl: string, endpoint: { method: string; path: string }): Promise<RequestResult> {
  const startTime = Date.now();
  const url = `${baseUrl}${endpoint.path}`;

  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const latency = Date.now() - startTime;

    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      status: response.status,
      latency,
      success: response.ok,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      endpoint: endpoint.path,
      method: endpoint.method,
      status: 0,
      latency,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Worker function for concurrent requests
async function worker(
  config: LoadTestConfig,
  results: RequestResult[],
  stopSignal: { stop: boolean }
): Promise<void> {
  while (!stopSignal.stop) {
    const endpoint = selectEndpoint();
    const result = await makeRequest(config.baseUrl, endpoint);
    results.push(result);

    // Rate limiting delay
    const delayMs = (config.concurrentUsers * 1000) / config.targetRPS;
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

// Calculate percentile
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil(arr.length * (p / 100)) - 1;
  return sorted[Math.max(0, index)];
}

// Analyze results
function analyzeResults(results: RequestResult[], durationSeconds: number): LoadTestResults {
  const latencies = results.map(r => r.latency);
  const successfulRequests = results.filter(r => r.success);

  // Calculate endpoint stats
  const endpointStats: Record<string, { count: number; totalLatency: number; errors: number }> = {};

  for (const result of results) {
    const key = `${result.method} ${result.endpoint}`;
    if (!endpointStats[key]) {
      endpointStats[key] = { count: 0, totalLatency: 0, errors: 0 };
    }
    endpointStats[key].count++;
    endpointStats[key].totalLatency += result.latency;
    if (!result.success) {
      endpointStats[key].errors++;
    }
  }

  const formattedStats: Record<string, { count: number; avgLatency: number; errorRate: number }> = {};
  for (const [key, stats] of Object.entries(endpointStats)) {
    formattedStats[key] = {
      count: stats.count,
      avgLatency: Math.round(stats.totalLatency / stats.count),
      errorRate: Math.round((stats.errors / stats.count) * 100 * 100) / 100,
    };
  }

  return {
    totalRequests: results.length,
    successfulRequests: successfulRequests.length,
    failedRequests: results.length - successfulRequests.length,
    averageLatency: Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length),
    p50Latency: percentile(latencies, 50),
    p95Latency: percentile(latencies, 95),
    p99Latency: percentile(latencies, 99),
    maxLatency: Math.max(...latencies),
    minLatency: Math.min(...latencies),
    requestsPerSecond: Math.round((results.length / durationSeconds) * 100) / 100,
    durationSeconds,
    endpointStats: formattedStats,
  };
}

// Print results
function printResults(results: LoadTestResults): void {
  console.log('\n===========================================');
  console.log('         LOAD TEST RESULTS');
  console.log('===========================================\n');

  console.log(`Duration: ${results.durationSeconds}s`);
  console.log(`Total Requests: ${results.totalRequests}`);
  console.log(`Successful: ${results.successfulRequests}`);
  console.log(`Failed: ${results.failedRequests}`);
  console.log(`Success Rate: ${((results.successfulRequests / results.totalRequests) * 100).toFixed(2)}%`);
  console.log(`Requests/sec: ${results.requestsPerSecond}`);

  console.log('\n--- Latency Statistics (ms) ---');
  console.log(`  Average: ${results.averageLatency}ms`);
  console.log(`  Min: ${results.minLatency}ms`);
  console.log(`  Max: ${results.maxLatency}ms`);
  console.log(`  P50: ${results.p50Latency}ms`);
  console.log(`  P95: ${results.p95Latency}ms`);
  console.log(`  P99: ${results.p99Latency}ms`);

  console.log('\n--- Endpoint Statistics ---');
  for (const [endpoint, stats] of Object.entries(results.endpointStats)) {
    console.log(`  ${endpoint}:`);
    console.log(`    Requests: ${stats.count}`);
    console.log(`    Avg Latency: ${stats.avgLatency}ms`);
    console.log(`    Error Rate: ${stats.errorRate}%`);
  }

  console.log('\n===========================================\n');
}

// Main function
async function main(): Promise<void> {
  const config = parseArgs();

  console.log('Starting Load Test...');
  console.log(`  Base URL: ${config.baseUrl}`);
  console.log(`  Concurrent Users: ${config.concurrentUsers}`);
  console.log(`  Duration: ${config.durationSeconds}s`);
  console.log(`  Target RPS: ${config.targetRPS}`);
  console.log('');

  const results: RequestResult[] = [];
  const stopSignal = { stop: false };

  // Start workers
  const workers: Promise<void>[] = [];
  for (let i = 0; i < config.concurrentUsers; i++) {
    workers.push(worker(config, results, stopSignal));
  }

  // Progress indicator
  const progressInterval = setInterval(() => {
    process.stdout.write(`\rRequests: ${results.length}`);
  }, 500);

  // Wait for duration
  await new Promise(resolve => setTimeout(resolve, config.durationSeconds * 1000));
  stopSignal.stop = true;

  // Wait for workers to finish current requests
  await Promise.all(workers);
  clearInterval(progressInterval);

  // Analyze and print results
  const analysis = analyzeResults(results, config.durationSeconds);
  printResults(analysis);

  // Exit with error if failure rate is high
  const failureRate = analysis.failedRequests / analysis.totalRequests;
  if (failureRate > 0.1) {
    console.error('WARNING: High failure rate detected!');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Load test failed:', error);
  process.exit(1);
});
