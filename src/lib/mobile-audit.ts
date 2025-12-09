// Mobile Responsiveness Audit Tool
// Comprehensive audit system for mobile compatibility and responsive design

export interface MobileAuditResult {
  score: number;
  issues: MobileIssue[];
  recommendations: string[];
  deviceCompatibility: DeviceCompatibility;
}

export interface MobileIssue {
  type: "critical" | "warning" | "info";
  category: "layout" | "performance" | "interaction" | "content";
  description: string;
  element?: string;
  fix?: string;
}

export interface DeviceCompatibility {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
  breakpoints: BreakpointTest[];
}

export interface BreakpointTest {
  width: number;
  passed: boolean;
  issues: string[];
}

class MobileResponsivenessAuditor {
  private issues: MobileIssue[] = [];
  private score = 100;

  async runAudit(): Promise<MobileAuditResult> {
    this.issues = [];
    this.score = 100;

    // Test viewport configuration
    this.checkViewportMeta();

    // Test responsive breakpoints
    const breakpoints = await this.testBreakpoints();

    // Test touch interactions
    this.checkTouchTargets();

    // Test content overflow
    this.checkContentOverflow();

    // Test image responsiveness
    this.checkResponsiveImages();

    // Test navigation usability
    this.checkMobileNavigation();

    // Test form usability
    this.checkMobileForms();

    // Test performance on mobile
    await this.checkMobilePerformance();

    return {
      score: Math.max(0, this.score),
      issues: this.issues,
      recommendations: this.generateRecommendations(),
      deviceCompatibility: {
        mobile: this.score > 70,
        tablet: this.score > 60,
        desktop: this.score > 50,
        breakpoints,
      },
    };
  }

  private checkViewportMeta() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      this.addIssue(
        "critical",
        "layout",
        "Missing viewport meta tag",
        "head",
        'Add <meta name="viewport" content="width=device-width, initial-scale=1">'
      );
    } else {
      const content = viewport.getAttribute("content") || "";
      if (!content.includes("width=device-width")) {
        this.addIssue(
          "warning",
          "layout",
          "Viewport not set to device width",
          'meta[name="viewport"]',
          "Set viewport width to device-width"
        );
      }
    }
  }

  private async testBreakpoints(): Promise<BreakpointTest[]> {
    const breakpoints = [320, 768, 1024, 1200];
    const results: BreakpointTest[] = [];

    for (const width of breakpoints) {
      const issues = await this.testBreakpoint(width);
      results.push({
        width,
        passed: issues.length === 0,
        issues,
      });
    }

    return results;
  }

  private async testBreakpoint(width: number): Promise<string[]> {
    // Simulate viewport change (in real implementation, this would use actual testing)
    const issues: string[] = [];

    // Check for horizontal scrollbars
    if (document.body.scrollWidth > width) {
      issues.push(`Horizontal overflow at ${width}px`);
    }

    // Check for overlapping elements
    const overlapping = this.findOverlappingElements();
    if (overlapping.length > 0) {
      issues.push(`${overlapping.length} overlapping elements`);
    }

    return issues;
  }

  private checkTouchTargets() {
    const clickableElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"]'
    );

    clickableElements.forEach((element) => {
      const rect = element.getBoundingClientRect();
      const minSize = 44; // Apple's recommended minimum touch target size

      if (rect.width < minSize || rect.height < minSize) {
        this.addIssue(
          "warning",
          "interaction",
          `Touch target too small (${Math.round(rect.width)}x${Math.round(rect.height)}px)`,
          this.getElementSelector(element as HTMLElement),
          `Increase size to at least ${minSize}x${minSize}px`
        );
      }
    });
  }

  private checkContentOverflow() {
    const elements = document.querySelectorAll("*");

    elements.forEach((element) => {
      const style = window.getComputedStyle(element);

      if (style.overflow === "visible" && element.scrollWidth > element.clientWidth) {
        this.addIssue(
          "warning",
          "layout",
          "Content overflow detected",
          this.getElementSelector(element as HTMLElement),
          "Add overflow handling or responsive text sizing"
        );
      }
    });
  }

  private checkResponsiveImages() {
    const images = document.querySelectorAll("img");

    images.forEach((img) => {
      const style = window.getComputedStyle(img);

      if (!style.maxWidth || style.maxWidth === "none") {
        this.addIssue(
          "info",
          "content",
          "Image may not be responsive",
          this.getElementSelector(img),
          "Add max-width: 100% or use responsive image classes"
        );
      }

      if (!img.getAttribute("alt")) {
        this.addIssue(
          "warning",
          "content",
          "Missing alt text",
          this.getElementSelector(img),
          "Add descriptive alt text for accessibility"
        );
      }
    });
  }

  private checkMobileNavigation() {
    const nav = document.querySelector("nav");
    if (!nav) return;

    // Check for mobile menu toggle
    const mobileToggle = nav.querySelector(
      "[data-mobile-toggle], [aria-expanded], .hamburger, .menu-toggle"
    );
    if (!mobileToggle && window.innerWidth < 768) {
      this.addIssue(
        "critical",
        "interaction",
        "No mobile navigation toggle found",
        "nav",
        "Add hamburger menu or mobile navigation toggle"
      );
    }

    // Check navigation spacing
    const navLinks = nav.querySelectorAll("a");
    navLinks.forEach((link) => {
      const rect = link.getBoundingClientRect();
      if (rect.height < 44) {
        this.addIssue(
          "warning",
          "interaction",
          "Navigation link too small for touch",
          this.getElementSelector(link),
          "Increase padding for better touch accessibility"
        );
      }
    });
  }

  private checkMobileForms() {
    const forms = document.querySelectorAll("form");

    forms.forEach((form) => {
      const inputs = form.querySelectorAll("input, select, textarea");

      inputs.forEach((input) => {
        const htmlInput = input as HTMLInputElement;
        const rect = input.getBoundingClientRect();

        // Check input size
        if (rect.height < 44) {
          this.addIssue(
            "warning",
            "interaction",
            "Form input too small for touch",
            this.getElementSelector(htmlInput),
            "Increase input height to at least 44px"
          );
        }

        // Check for appropriate input types
        if (htmlInput.type === "text") {
          const name = htmlInput.name.toLowerCase();
          if (name.includes("email")) {
            this.addIssue(
              "info",
              "interaction",
              "Consider using email input type",
              this.getElementSelector(htmlInput),
              'Use type="email" for better mobile keyboard'
            );
          }
          if (name.includes("phone") || name.includes("tel")) {
            this.addIssue(
              "info",
              "interaction",
              "Consider using tel input type",
              this.getElementSelector(htmlInput),
              'Use type="tel" for number keyboard on mobile'
            );
          }
        }
      });
    });
  }

  private async checkMobilePerformance() {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType) {
        const slowConnections = ["slow-2g", "2g", "3g"];
        if (slowConnections.includes(connection.effectiveType)) {
          this.addIssue(
            "info",
            "performance",
            "Slow network connection detected",
            "global",
            "Consider optimizing images and reducing bundle size"
          );
        }
      }
    }

    // Check for large images
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      if (img.naturalWidth > 1200 || img.naturalHeight > 1200) {
        this.addIssue(
          "warning",
          "performance",
          "Large image detected",
          this.getElementSelector(img),
          "Consider using responsive images or WebP format"
        );
      }
    });
  }

  private findOverlappingElements(): HTMLElement[] {
    const elements = Array.from(document.querySelectorAll("*")) as HTMLElement[];
    const overlapping: HTMLElement[] = [];

    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        if (this.elementsOverlap(elements[i], elements[j])) {
          overlapping.push(elements[i], elements[j]);
        }
      }
    }

    return [...new Set(overlapping)];
  }

  private elementsOverlap(el1: HTMLElement, el2: HTMLElement): boolean {
    const rect1 = el1.getBoundingClientRect();
    const rect2 = el2.getBoundingClientRect();

    return !(
      rect1.right < rect2.left ||
      rect2.right < rect1.left ||
      rect1.bottom < rect2.top ||
      rect2.bottom < rect1.top
    );
  }

  private addIssue(
    type: MobileIssue["type"],
    category: MobileIssue["category"],
    description: string,
    element?: string,
    fix?: string
  ) {
    this.issues.push({ type, category, description, element, fix });

    // Deduct points based on severity
    const deduction = type === "critical" ? 20 : type === "warning" ? 10 : 5;
    this.score -= deduction;
  }

  private getElementSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(" ")[0]}`;
    return element.tagName.toLowerCase();
  }

  private generateRecommendations(): string[] {
    const recommendations = [
      "Test on actual mobile devices, not just browser DevTools",
      "Use relative units (rem, em, %) instead of fixed pixels",
      "Implement touch-friendly navigation patterns",
      "Optimize images for different screen densities",
      "Test with slow network connections",
      "Ensure critical content loads first",
      "Use appropriate input types for mobile keyboards",
      "Test with one-handed usage patterns",
    ];

    // Add specific recommendations based on issues found
    const criticalIssues = this.issues.filter((i) => i.type === "critical").length;
    if (criticalIssues > 0) {
      recommendations.unshift("Address critical mobile issues immediately");
    }

    return recommendations;
  }
}

// Export singleton instance
export const mobileAuditor = new MobileResponsivenessAuditor();

// Utility functions for manual testing
export const mobileTestUtils = {
  simulateViewport: (width: number, height: number) => {
    document.documentElement.style.width = `${width}px`;
    document.documentElement.style.height = `${height}px`;
  },

  testTouchTargets: () => {
    const style = document.createElement("style");
    style.textContent = `
      .touch-target-test { outline: 2px solid red !important; }
      .touch-target-test.good { outline-color: green !important; }
    `;
    document.head.appendChild(style);

    document
      .querySelectorAll('button, a, input, select, textarea, [role="button"]')
      .forEach((el) => {
        const rect = el.getBoundingClientRect();
        el.classList.add("touch-target-test");
        if (rect.width >= 44 && rect.height >= 44) {
          el.classList.add("good");
        }
      });
  },

  showBreakpoints: () => {
    const breakpoints = [320, 768, 1024, 1200];
    breakpoints.forEach((bp) => {
      const line = document.createElement("div");
      line.style.cssText = `
        position: fixed;
        top: 0;
        left: ${bp}px;
        width: 2px;
        height: 100vh;
        background: red;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(line);
    });
  },
};
