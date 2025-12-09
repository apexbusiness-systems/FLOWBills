import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Load test configuration
export interface LoadTestConfig {
  duration: number; // Test duration in seconds
  concurrentUsers: number; // Simulated concurrent users
  rampUpTime: number; // Time to reach full load
  endpoints: LoadTestEndpoint[];
}

// Endpoint configuration for load testing
export interface LoadTestEndpoint {
  name: string;
  url?: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  table?: string; // Supabase table name
  query?: (client: typeof supabase) => Promise<any>;
  weight: number; // Probability weight for this endpoint
  payload?: any;
}

// Load test results
export interface LoadTestResult {
  endpoint: string;
  method: string;
  duration: number;
  status: number;
  success: boolean;
  timestamp: number;
  userId?: number;
}

// Load test metrics
export interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
}

class LoadTester {
  private static instance: LoadTester;
  private isRunning: boolean = false;
  private results: LoadTestResult[] = [];
  private startTime: number = 0;
  private activeUsers: number = 0;

  static getInstance(): LoadTester {
    if (!LoadTester.instance) {
      LoadTester.instance = new LoadTester();
    }
    return LoadTester.instance;
  }

  // Run load test
  async runLoadTest(config: LoadTestConfig): Promise<LoadTestMetrics> {
    if (this.isRunning) {
      throw new Error("Load test is already running");
    }

    this.isRunning = true;
    this.results = [];
    this.startTime = Date.now();
    this.activeUsers = 0;

    toast({
      title: "Load Test Started",
      description: `Testing with ${config.concurrentUsers} concurrent users for ${config.duration}s`,
    });

    try {
      // Ramp up users gradually
      const rampUpInterval = (config.rampUpTime * 1000) / config.concurrentUsers;
      const testPromises: Promise<void>[] = [];

      for (let i = 0; i < config.concurrentUsers; i++) {
        const delay = i * rampUpInterval;

        testPromises.push(
          new Promise((resolve) => {
            setTimeout(() => {
              this.simulateUser(i + 1, config).finally(() => {
                this.activeUsers--;
                resolve();
              });
            }, delay);
          })
        );
      }

      // Wait for all users to complete or timeout
      await Promise.race([
        Promise.all(testPromises),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Load test timeout")),
            (config.duration + config.rampUpTime + 10) * 1000
          )
        ),
      ]);
    } finally {
      this.isRunning = false;
    }

    const metrics = this.calculateMetrics(config);

    toast({
      title: "Load Test Completed",
      description: `${metrics.totalRequests} requests completed with ${metrics.errorRate}% error rate`,
    });

    return metrics;
  }

  // Simulate individual user behavior
  private async simulateUser(userId: number, config: LoadTestConfig): Promise<void> {
    this.activeUsers++;
    const endTime = this.startTime + config.duration * 1000;

    while (Date.now() < endTime && this.isRunning) {
      try {
        // Select endpoint based on weight
        const endpoint = this.selectEndpoint(config.endpoints);

        // Execute request
        await this.executeRequest(userId, endpoint);

        // Random delay between requests (500ms to 2000ms)
        const delay = Math.random() * 1500 + 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error) {
        console.error(`User ${userId} error:`, error);
      }
    }
  }

  // Select endpoint based on weight
  private selectEndpoint(endpoints: LoadTestEndpoint[]): LoadTestEndpoint {
    const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0);
    const random = Math.random() * totalWeight;

    let currentWeight = 0;
    for (const endpoint of endpoints) {
      currentWeight += endpoint.weight;
      if (random <= currentWeight) {
        return endpoint;
      }
    }

    return endpoints[0]; // Fallback
  }

  // Execute individual request
  private async executeRequest(userId: number, endpoint: LoadTestEndpoint): Promise<void> {
    const startTime = performance.now();
    let success = false;
    let status = 0;

    try {
      if (endpoint.table && endpoint.query) {
        // Supabase query
        const result = await endpoint.query(supabase);
        success = !result.error;
        status = result.error ? 400 : 200;
      } else if (endpoint.url) {
        // HTTP request
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            "Content-Type": "application/json",
          },
          body: endpoint.payload ? JSON.stringify(endpoint.payload) : undefined,
        });

        success = response.ok;
        status = response.status;
      } else {
        throw new Error("Invalid endpoint configuration");
      }
    } catch (error) {
      success = false;
      status = 0;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Record result
    this.results.push({
      endpoint: endpoint.name,
      method: endpoint.method,
      duration,
      status,
      success,
      timestamp: Date.now(),
      userId,
    });
  }

  // Calculate test metrics
  private calculateMetrics(config: LoadTestConfig): LoadTestMetrics {
    const totalRequests = this.results.length;
    const successfulRequests = this.results.filter((r) => r.success).length;
    const failedRequests = totalRequests - successfulRequests;

    const durations = this.results.map((r) => r.duration).sort((a, b) => a - b);
    const avgResponseTime = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minResponseTime = durations[0] || 0;
    const maxResponseTime = durations[durations.length - 1] || 0;

    const testDuration = (Date.now() - this.startTime) / 1000;
    const requestsPerSecond = totalRequests / testDuration;
    const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;

    // Calculate percentiles
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);
    const p95ResponseTime = durations[p95Index] || 0;
    const p99ResponseTime = durations[p99Index] || 0;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
      minResponseTime: parseFloat(minResponseTime.toFixed(2)),
      maxResponseTime: parseFloat(maxResponseTime.toFixed(2)),
      requestsPerSecond: parseFloat(requestsPerSecond.toFixed(2)),
      errorRate: parseFloat(errorRate.toFixed(2)),
      p95ResponseTime: parseFloat(p95ResponseTime.toFixed(2)),
      p99ResponseTime: parseFloat(p99ResponseTime.toFixed(2)),
    };
  }

  // Get real-time test status
  getTestStatus() {
    if (!this.isRunning) {
      return {
        running: false,
        activeUsers: 0,
        totalRequests: 0,
        duration: 0,
      };
    }

    const duration = (Date.now() - this.startTime) / 1000;

    return {
      running: true,
      activeUsers: this.activeUsers,
      totalRequests: this.results.length,
      duration: parseFloat(duration.toFixed(1)),
    };
  }

  // Stop running test
  stopTest() {
    this.isRunning = false;
    toast({
      title: "Load Test Stopped",
      description: "Load test was manually stopped",
    });
  }

  // Get detailed results
  getDetailedResults() {
    return {
      results: this.results,
      endpointStats: this.getEndpointStatistics(),
      timelineData: this.getTimelineData(),
    };
  }

  // Get statistics by endpoint
  private getEndpointStatistics() {
    const endpointGroups = this.results.reduce(
      (groups, result) => {
        if (!groups[result.endpoint]) {
          groups[result.endpoint] = [];
        }
        groups[result.endpoint].push(result);
        return groups;
      },
      {} as Record<string, LoadTestResult[]>
    );

    return Object.entries(endpointGroups).map(([endpoint, results]) => {
      const totalRequests = results.length;
      const successfulRequests = results.filter((r) => r.success).length;
      const durations = results.map((r) => r.duration);
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

      return {
        endpoint,
        totalRequests,
        successfulRequests,
        errorRate: (((totalRequests - successfulRequests) / totalRequests) * 100).toFixed(2) + "%",
        avgResponseTime: avgDuration.toFixed(2) + "ms",
        minResponseTime: Math.min(...durations).toFixed(2) + "ms",
        maxResponseTime: Math.max(...durations).toFixed(2) + "ms",
      };
    });
  }

  // Get timeline data for visualization
  private getTimelineData() {
    const buckets = 20; // Number of time buckets
    const testDuration = Date.now() - this.startTime;
    const bucketSize = testDuration / buckets;

    const timeline = Array.from({ length: buckets }, (_, i) => ({
      timestamp: this.startTime + i * bucketSize,
      requests: 0,
      errors: 0,
      avgResponseTime: 0,
    }));

    this.results.forEach((result) => {
      const bucketIndex = Math.floor((result.timestamp - this.startTime) / bucketSize);
      if (bucketIndex >= 0 && bucketIndex < buckets) {
        timeline[bucketIndex].requests++;
        if (!result.success) {
          timeline[bucketIndex].errors++;
        }
      }
    });

    return timeline;
  }

  // Clear test data
  clearResults() {
    this.results = [];
  }
}

// Predefined load test scenarios
export const LoadTestScenarios = {
  // Light load test
  light: (): LoadTestConfig => ({
    duration: 30,
    concurrentUsers: 5,
    rampUpTime: 10,
    endpoints: [
      {
        name: "Dashboard",
        table: "invoices",
        method: "GET",
        query: async (client) => await client.from("invoices").select("*").limit(10),
        weight: 3,
      },
      {
        name: "Search",
        table: "invoices",
        method: "GET",
        query: async (client) =>
          await client.from("invoices").select("*").ilike("vendor_name", "%test%"),
        weight: 2,
      },
      {
        name: "Analytics",
        table: "exceptions",
        method: "GET",
        query: async (client) => await client.from("exceptions").select("count"),
        weight: 1,
      },
    ],
  }),

  // Medium load test
  medium: (): LoadTestConfig => ({
    duration: 120,
    concurrentUsers: 20,
    rampUpTime: 30,
    endpoints: [
      {
        name: "Dashboard",
        table: "invoices",
        method: "GET",
        query: async (client) => await client.from("invoices").select("*").limit(20),
        weight: 4,
      },
      {
        name: "Upload",
        table: "invoices",
        method: "POST",
        query: async (client) =>
          await client.from("invoices").insert({
            vendor_name: "Load Test Company",
            invoice_number: `LT-${Math.floor(Math.random() * 100000)}`,
            invoice_date: new Date().toISOString().split("T")[0],
            amount: Math.random() * 10000,
            status: "pending",
            user_id: "00000000-0000-0000-0000-000000000000", // Default test user
          }),
        weight: 2,
      },
      {
        name: "Compliance Check",
        table: "compliance_records",
        method: "GET",
        query: async (client) => await client.from("compliance_records").select("*").limit(10),
        weight: 3,
      },
    ],
  }),

  // Heavy load test
  heavy: (): LoadTestConfig => ({
    duration: 300,
    concurrentUsers: 50,
    rampUpTime: 60,
    endpoints: [
      {
        name: "Complex Query",
        table: "invoices",
        method: "GET",
        query: async (client) => await client.from("invoices").select("*").limit(5),
        weight: 2,
      },
      {
        name: "Bulk Operations",
        table: "invoices",
        method: "POST",
        query: async (client) =>
          await client.from("invoices").insert(
            Array.from({ length: 5 }, (_, i) => ({
              vendor_name: `Bulk Test Company ${i}`,
              invoice_number: `BT-${Math.floor(Math.random() * 100000)}-${i}`,
              invoice_date: new Date().toISOString().split("T")[0],
              amount: Math.random() * 10000,
              status: "pending" as const,
              user_id: "00000000-0000-0000-0000-000000000000",
            }))
          ),
        weight: 1,
      },
      {
        name: "Search & Filter",
        table: "invoices",
        method: "GET",
        query: async (client) =>
          await client
            .from("invoices")
            .select("*")
            .gte("amount", 1000)
            .order("created_at", { ascending: false })
            .limit(20),
        weight: 3,
      },
    ],
  }),
};

export const loadTester = LoadTester.getInstance();
