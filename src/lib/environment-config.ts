// Environment Configuration Management
// Centralized configuration system for managing different environments

export type Environment = "development" | "staging" | "production";

export interface EnvironmentConfig {
  app: {
    name: string;
    version: string;
    environment: Environment;
    debug: boolean;
    logLevel: "error" | "warn" | "info" | "debug";
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  features: {
    enableAnalytics: boolean;
    enablePerformanceMonitoring: boolean;
    enableErrorReporting: boolean;
    enableLoadTesting: boolean;
    maxFileUploadSize: number;
  };
  security: {
    enableCSP: boolean;
    trustedDomains: string[];
    sessionTimeout: number;
  };
}

// Default configuration
const defaultConfig: EnvironmentConfig = {
  app: {
    name: "Oil & Gas Billing Platform",
    version: "1.0.0",
    environment: "development",
    debug: true,
    logLevel: "debug",
  },
  api: {
    baseUrl: "http://localhost:3000/api",
    timeout: 5000,
    retryAttempts: 3,
  },
  features: {
    enableAnalytics: true,
    enablePerformanceMonitoring: true,
    enableErrorReporting: true,
    enableLoadTesting: false,
    maxFileUploadSize: 10 * 1024 * 1024, // 10MB
  },
  security: {
    enableCSP: true,
    trustedDomains: ["localhost"],
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  },
};

// Environment-specific overrides
const environmentConfigs: Record<string, Partial<EnvironmentConfig>> = {
  development: {
    app: {
      name: "Oil & Gas Billing - Dev",
      version: "1.0.0-dev",
      environment: "development",
      debug: true,
      logLevel: "debug",
    },
    api: {
      baseUrl: "http://localhost:3000/api",
      timeout: 10000,
      retryAttempts: 1,
    },
    features: {
      enableAnalytics: true,
      enablePerformanceMonitoring: true,
      enableErrorReporting: true,
      enableLoadTesting: true,
      maxFileUploadSize: 10 * 1024 * 1024, // 10MB
    },
    security: {
      enableCSP: false,
      trustedDomains: ["localhost:5173", "localhost:3000"],
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    },
  },

  staging: {
    app: {
      name: "Oil & Gas Billing - Staging",
      version: "1.0.0-staging",
      environment: "staging",
      debug: false,
      logLevel: "info",
    },
    api: {
      baseUrl: "https://staging-api.oilgasbilling.com",
      timeout: 8000,
      retryAttempts: 2,
    },
    features: {
      enableAnalytics: true,
      enablePerformanceMonitoring: true,
      enableErrorReporting: true,
      enableLoadTesting: true,
      maxFileUploadSize: 25 * 1024 * 1024, // 25MB
    },
    security: {
      enableCSP: true,
      trustedDomains: ["staging.oilgasbilling.com"],
      sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
    },
  },

  production: {
    app: {
      name: "Oil & Gas Billing",
      version: "1.0.0",
      environment: "production",
      debug: false,
      logLevel: "error",
    },
    api: {
      baseUrl: "https://api.oilgasbilling.com",
      timeout: 5000,
      retryAttempts: 3,
    },
    features: {
      enableAnalytics: true,
      enablePerformanceMonitoring: true,
      enableErrorReporting: true,
      enableLoadTesting: false,
      maxFileUploadSize: 50 * 1024 * 1024, // 50MB
    },
    security: {
      enableCSP: true,
      trustedDomains: ["oilgasbilling.com", "www.oilgasbilling.com"],
      sessionTimeout: 4 * 60 * 60 * 1000, // 4 hours
    },
  },
};

class EnvironmentManager {
  private config: EnvironmentConfig;
  private currentEnvironment: Environment;

  constructor() {
    this.currentEnvironment = this.detectEnvironment();
    this.config = this.buildConfig();
  }

  private detectEnvironment(): Environment {
    // Check environment variables
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;

      if (hostname.includes("staging")) {
        return "staging";
      }

      if (hostname === "localhost" || hostname === "127.0.0.1") {
        return "development";
      }

      return "production";
    }

    // Server-side detection
    const nodeEnv = process.env.NODE_ENV;
    if (nodeEnv === "production") return "production";
    if (nodeEnv === "staging") return "staging";
    return "development";
  }

  private buildConfig(): EnvironmentConfig {
    const envConfig = environmentConfigs[this.currentEnvironment] || {};
    return this.mergeConfigs(defaultConfig, envConfig);
  }

  private mergeConfigs(
    base: EnvironmentConfig,
    override: Partial<EnvironmentConfig>
  ): EnvironmentConfig {
    const merged = { ...base };

    for (const key in override) {
      if (
        override[key as keyof EnvironmentConfig] &&
        typeof override[key as keyof EnvironmentConfig] === "object"
      ) {
        merged[key as keyof EnvironmentConfig] = {
          ...base[key as keyof EnvironmentConfig],
          ...override[key as keyof EnvironmentConfig],
        } as any;
      } else if (override[key as keyof EnvironmentConfig] !== undefined) {
        merged[key as keyof EnvironmentConfig] = override[key as keyof EnvironmentConfig] as any;
      }
    }

    return merged;
  }

  // Public API
  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  getCurrentEnvironment(): Environment {
    return this.currentEnvironment;
  }

  isProduction(): boolean {
    return this.currentEnvironment === "production";
  }

  isDevelopment(): boolean {
    return this.currentEnvironment === "development";
  }

  isStaging(): boolean {
    return this.currentEnvironment === "staging";
  }

  getApiConfig() {
    return this.config.api;
  }

  getAppConfig() {
    return this.config.app;
  }

  getSecurityConfig() {
    return this.config.security;
  }

  getFeaturesConfig() {
    return this.config.features;
  }

  // Feature flag helpers
  isFeatureEnabled(feature: keyof EnvironmentConfig["features"]): boolean {
    return this.config.features[feature] as boolean;
  }

  // Update configuration at runtime (for A/B testing, feature flags, etc.)
  updateFeature(feature: keyof EnvironmentConfig["features"], value: any) {
    this.config.features[feature] = value as never;
  }

  // Validate configuration
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.app.name) {
      errors.push("App name is required");
    }

    if (!this.config.api.baseUrl) {
      errors.push("API base URL is required");
    }

    if (this.config.api.timeout <= 0) {
      errors.push("API timeout must be positive");
    }

    if (this.config.features.maxFileUploadSize <= 0) {
      errors.push("Max file upload size must be positive");
    }

    if (this.config.security.sessionTimeout <= 0) {
      errors.push("Session timeout must be positive");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Environment-specific logging
  log(level: "error" | "warn" | "info" | "debug", message: string, data?: any) {
    const logLevels = ["error", "warn", "info", "debug"];
    const currentLevelIndex = logLevels.indexOf(this.config.app.logLevel);
    const messageLevelIndex = logLevels.indexOf(level);

    if (messageLevelIndex <= currentLevelIndex) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

      if (data) {
        console[level](logMessage, data);
      } else {
        console[level](logMessage);
      }
    }
  }

  // Performance monitoring helpers
  startPerformanceTimer(label: string): () => void {
    if (!this.isFeatureEnabled("enablePerformanceMonitoring")) {
      return () => {};
    }

    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.log("debug", `Performance: ${label} took ${duration.toFixed(2)}ms`);
    };
  }
}

// Singleton instance
const environmentManager = new EnvironmentManager();

export default environmentManager;
export { EnvironmentManager };
