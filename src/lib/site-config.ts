/**
 * Brand and Site Configuration
 * Centralized configuration for brand identity and content guidelines
 */

export const Brand = {
  name: "FLOWBills.ca",
  tagline: "Automate invoices. Approve faster. Close with confidence.",
  subline: "Capture → validate → dedupe/fraud check → human-in-the-loop → approve → export to ERP.",
  
  // Content security: prevent re-introduction of banned terms
  bannedTerms: [
    /tradeline/i,
    /call\s*center/i,
    /never\s+miss\s+a\s+call/i,
    /\btelecom\b/i,
    /klaviyo/i,
    /marketing\s*automation/i,
    /email\s*campaigns/i
  ],
} as const;

/**
 * Validate content against banned terms
 */
export const validateContent = (content: string): { valid: boolean; violations: string[] } => {
  const violations: string[] = [];
  
  Brand.bannedTerms.forEach(pattern => {
    if (pattern.test(content)) {
      violations.push(`Banned term pattern detected: ${pattern}`);
    }
  });
  
  return {
    valid: violations.length === 0,
    violations
  };
};

/**
 * Site-wide configuration
 */
export const SiteConfig = {
  brand: Brand,
  security: {
    enableCSP: true,
    strictMode: true,
  },
  analytics: {
    gtmId: '', // GTM disabled - not using VITE_ env vars per Lovable requirements
    enableTracking: false,
    enableProductionOnly: true,
  },
  observability: {
    enableMetrics: true,
  },
  features: {
    allowMarketingIntegrations: false, // Block Klaviyo and similar
    enableThirdPartyScripts: false,
  }
} as const;

export default SiteConfig;