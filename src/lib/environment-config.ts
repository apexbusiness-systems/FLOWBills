// Environment configuration management
export interface EnvironmentConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    debug: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey?: string;
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
    name: 'Oil & Gas Billing Platform',
    version: '1.0.0',
    environment: 'development',
    debug: true,
    logLevel: 'debug',
  },
  supabase: {
    url: 'https://ullqluvzkgnwwqijhvjr.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsbHFsdXZ6a2dud3dxaWpodmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MTY2OTEsImV4cCI6MjA3NDE5MjY5MX0.UjijCIx4OrtbSgmyDqdf455nUPD9AS0OIgOPopzaJGI',
  },
  api: {
    baseUrl: '/api',
    timeout: 10000,
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
    trustedDomains: ['*.supabase.co', '*.lovableproject.com'],
    sessionTimeout: 8 * 60 * 60 * 1000, // 8 hours
  },
};

// Environment-specific overrides
const environmentConfigs: Record<string, Partial<EnvironmentConfig>> = {
  development: {
    app: {
      debug: true,
      logLevel: 'debug',
    },
    features: {
      enableLoadTesting: true,
    },
    security: {
      enableCSP: false, // Disable in dev for easier debugging
    },
  },
  
  staging: {
    app: {
      environment: 'staging',
      debug: false,
      logLevel: 'info',
    },
    features: {
      enableLoadTesting: true,
    },
  },
  
  production: {
    app: {
      environment: 'production',
      debug: false,
      logLevel: 'error',
    },
    api: {
      timeout: 5000, // Shorter timeout in production
    },
    features: {
      enableLoadTesting: false, // Disable load testing in production
    },
    security: {
      enableCSP: true,
      sessionTimeout: 4 * 60 * 60 * 1000, // 4 hours in production
    },
  },
};

class EnvironmentManager {
  private static instance: EnvironmentManager;
  private config: EnvironmentConfig;
  
  private constructor() {
    this.config = this.loadConfiguration();
  }
  
  static getInstance(): EnvironmentManager {
    if (!EnvironmentManager.instance) {
      EnvironmentManager.instance = new EnvironmentManager();
    }
    return EnvironmentManager.instance;
  }
  
  private loadConfiguration(): EnvironmentConfig {
    const environment = this.detectEnvironment();
    const envConfig = environmentConfigs[environment] || {};
    
    // Deep merge configurations
    const merged = this.deepMerge(defaultConfig, envConfig);
    
    // Override with runtime environment variables if available
    return this.applyRuntimeOverrides(merged);
  }
  
  private detectEnvironment(): string {
    // Detect environment from various sources
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        return 'development';
      }
      
      if (hostname.includes('staging') || hostname.includes('preview')) {
        return 'staging';
      }
      
      return 'production';
    }
    
    return process.env.NODE_ENV || 'development';
  }
  
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  private applyRuntimeOverrides(config: EnvironmentConfig): EnvironmentConfig {
    // In a real application, you might load these from environment variables
    // or a remote configuration service
    
    return config;
  }
  
  // Public API
  get(): EnvironmentConfig {
    return { ...this.config };
  }
  
  getApp() {
    return this.config.app;
  }
  
  getSupabase() {
    return this.config.supabase;
  }
  
  getAPI() {
    return this.config.api;
  }
  
  getFeatures() {
    return this.config.features;
  }
  
  getSecurity() {
    return this.config.security;
  }
  
  isProduction(): boolean {
    return this.config.app.environment === 'production';
  }
  
  isStaging(): boolean {
    return this.config.app.environment === 'staging';
  }
  
  isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }
  
  isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    return this.config.features[feature] as boolean;
  }
  
  // Update configuration at runtime (for A/B testing, feature flags, etc.)
  updateFeature(feature: keyof EnvironmentConfig['features'], value: any) {
    this.config.features[feature] = value;
  }
  
  // Validate configuration
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields validation
    if (!this.config.supabase.url) {
      errors.push('Supabase URL is required');
    }
    
    if (!this.config.supabase.anonKey) {
      errors.push('Supabase anon key is required');
    }
    
    // URL validation
    try {
      new URL(this.config.supabase.url);
    } catch {
      errors.push('Invalid Supabase URL');
    }
    
    // Timeout validation
    if (this.config.api.timeout <= 0) {
      errors.push('API timeout must be positive');
    }
    
    // File size validation
    if (this.config.features.maxFileUploadSize <= 0) {
      errors.push('Max file upload size must be positive');
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }
  
  // Export configuration for debugging
  export(): string {
    const safeConfig = { ...this.config };
    
    // Remove sensitive information
    if (safeConfig.supabase.serviceRoleKey) {
      safeConfig.supabase.serviceRoleKey = '***REDACTED***';
    }
    
    return JSON.stringify(safeConfig, null, 2);
  }
  
  // Health check
  async healthCheck(): Promise<{ healthy: boolean; checks: Record<string, boolean> }> {
    const checks: Record<string, boolean> = {};
    
    // Configuration validation
    const validation = this.validate();
    checks.configuration = validation.valid;
    
    // Supabase connectivity
    try {
      const response = await fetch(`${this.config.supabase.url}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': this.config.supabase.anonKey,
        },
      });
      checks.supabase = response.ok;
    } catch {
      checks.supabase = false;
    }
    
    // Feature flags
    checks.features = Object.keys(this.config.features).length > 0;
    
    const healthy = Object.values(checks).every(check => check);
    
    return { healthy, checks };
  }
}

// Singleton instance
export const environmentConfig = EnvironmentManager.getInstance();

// Convenience exports
export const config = environmentConfig.get();
export const appConfig = environmentConfig.getApp();
export const supabaseConfig = environmentConfig.getSupabase();
export const apiConfig = environmentConfig.getAPI();
export const featureConfig = environmentConfig.getFeatures();
export const securityConfig = environmentConfig.getSecurity();