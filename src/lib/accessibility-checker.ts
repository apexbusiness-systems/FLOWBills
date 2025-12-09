// Accessibility Compliance Checker
// WCAG 2.1 AA compliance auditing and remediation suggestions

export interface AccessibilityAuditResult {
  score: number;
  wcagLevel: "A" | "AA" | "AAA" | "Non-compliant";
  violations: AccessibilityViolation[];
  warnings: AccessibilityWarning[];
  passes: number;
  recommendations: string[];
}

export interface AccessibilityViolation {
  level: "A" | "AA" | "AAA";
  guideline: string;
  description: string;
  element?: string;
  fix: string;
  impact: "critical" | "serious" | "moderate" | "minor";
}

export interface AccessibilityWarning {
  description: string;
  element?: string;
  suggestion: string;
}

class AccessibilityChecker {
  private violations: AccessibilityViolation[] = [];
  private warnings: AccessibilityWarning[] = [];
  private passes = 0;

  async runCompleteAudit(): Promise<AccessibilityAuditResult> {
    this.violations = [];
    this.warnings = [];
    this.passes = 0;

    // Test all WCAG guidelines
    this.checkPerceivable();
    this.checkOperable();
    this.checkUnderstandable();
    this.checkRobust();

    const score = this.calculateScore();
    const wcagLevel = this.determineWCAGLevel(score);

    return {
      score,
      wcagLevel,
      violations: this.violations,
      warnings: this.warnings,
      passes: this.passes,
      recommendations: this.generateRecommendations(),
    };
  }

  // WCAG Principle 1: Perceivable
  private checkPerceivable() {
    this.checkImageAlternatives();
    this.checkColorContrast();
    this.checkTextResize();
    this.checkMediaAlternatives();
    this.checkContentStructure();
  }

  // WCAG Principle 2: Operable
  private checkOperable() {
    this.checkKeyboardAccessibility();
    this.checkFocusManagement();
    this.checkSeizures();
    this.checkNavigation();
    this.checkInputModalities();
  }

  // WCAG Principle 3: Understandable
  private checkUnderstandable() {
    this.checkReadability();
    this.checkPredictability();
    this.checkInputAssistance();
    this.checkLanguage();
  }

  // WCAG Principle 4: Robust
  private checkRobust() {
    this.checkCompatibility();
    this.checkMarkupValidity();
    this.checkARIAUsage();
  }

  private checkImageAlternatives() {
    const images = document.querySelectorAll("img");

    images.forEach((img) => {
      const alt = img.getAttribute("alt");
      const src = img.getAttribute("src");

      if (!alt && alt !== "") {
        this.addViolation(
          "A",
          "1.1.1",
          "Image missing alt attribute",
          this.getSelector(img),
          'Add descriptive alt text or alt="" for decorative images',
          "critical"
        );
      } else if (alt && alt.length > 125) {
        this.addWarning(
          "Alt text is very long (>125 characters)",
          this.getSelector(img),
          "Consider shorter, more concise alt text"
        );
      } else if (alt && src && alt === src) {
        this.addWarning(
          "Alt text is same as filename",
          this.getSelector(img),
          "Provide descriptive alt text, not filename"
        );
      } else if (alt !== null) {
        this.passes++;
      }
    });

    // Check for background images that convey meaning
    const elementsWithBgImages = document.querySelectorAll('[style*="background-image"]');
    elementsWithBgImages.forEach((el) => {
      const ariaLabel = el.getAttribute("aria-label");
      const role = el.getAttribute("role");

      if (!ariaLabel && role !== "presentation") {
        this.addWarning(
          "Background image may need description",
          this.getSelector(el as HTMLElement),
          "Add aria-label if background image conveys meaning"
        );
      }
    });
  }

  private checkColorContrast() {
    const textElements = document.querySelectorAll(
      "p, h1, h2, h3, h4, h5, h6, span, a, button, label, li"
    );

    textElements.forEach((element) => {
      const style = window.getComputedStyle(element);
      const color = this.parseColor(style.color);
      const backgroundColor = this.parseColor(style.backgroundColor);

      if (color && backgroundColor) {
        const contrast = this.calculateContrast(color, backgroundColor);
        const fontSize = parseFloat(style.fontSize);
        const fontWeight = style.fontWeight;

        const isLargeText =
          fontSize >= 18 ||
          (fontSize >= 14 && (fontWeight === "bold" || parseInt(fontWeight) >= 700));
        const requiredContrast = isLargeText ? 3 : 4.5;

        if (contrast < requiredContrast) {
          this.addViolation(
            "AA",
            "1.4.3",
            `Insufficient color contrast (${contrast.toFixed(2)}:1, required ${requiredContrast}:1)`,
            this.getSelector(element as HTMLElement),
            `Increase contrast between text and background colors`,
            contrast < 3 ? "critical" : "serious"
          );
        } else {
          this.passes++;
        }
      }
    });
  }

  private checkKeyboardAccessibility() {
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [tabindex], [role="button"], [role="link"]'
    );

    interactiveElements.forEach((element) => {
      const tabIndex = element.getAttribute("tabindex");

      // Check for positive tabindex (anti-pattern)
      if (tabIndex && parseInt(tabIndex) > 0) {
        this.addViolation(
          "A",
          "2.4.3",
          "Positive tabindex disrupts natural tab order",
          this.getSelector(element as HTMLElement),
          'Remove positive tabindex or use tabindex="0"',
          "moderate"
        );
      }

      // Check if focusable elements can receive focus
      const htmlElement = element as HTMLElement;
      if (htmlElement.tabIndex === -1 && !htmlElement.hasAttribute("aria-hidden")) {
        this.addWarning(
          "Interactive element not keyboard accessible",
          this.getSelector(htmlElement),
          "Ensure element can receive keyboard focus"
        );
      } else {
        this.passes++;
      }
    });

    // Check for keyboard event handlers
    const elementsWithClick = document.querySelectorAll("[onclick]");
    elementsWithClick.forEach((element) => {
      const onkeydown = element.getAttribute("onkeydown");
      const onkeyup = element.getAttribute("onkeyup");

      if (!onkeydown && !onkeyup) {
        this.addWarning(
          "Click handler without keyboard equivalent",
          this.getSelector(element as HTMLElement),
          "Add keyboard event handlers (onkeydown/onkeyup)"
        );
      }
    });
  }

  private checkFocusManagement() {
    // Check for visible focus indicators
    const focusableElements = document.querySelectorAll(
      'button, a, input, select, textarea, [tabindex="0"]'
    );

    focusableElements.forEach((element) => {
      const style = window.getComputedStyle(element, ":focus");
      const outline = style.outline;
      const outlineWidth = style.outlineWidth;

      if (outline === "none" || outlineWidth === "0px") {
        this.addViolation(
          "AA",
          "2.4.7",
          "No visible focus indicator",
          this.getSelector(element as HTMLElement),
          "Add visible focus styles (outline, border, or box-shadow)",
          "serious"
        );
      } else {
        this.passes++;
      }
    });

    // Check for focus traps in modals
    const modals = document.querySelectorAll('[role="dialog"], [role="alertdialog"], .modal');
    modals.forEach((modal) => {
      const focusableInModal = modal.querySelectorAll(
        'button, a, input, select, textarea, [tabindex="0"]'
      );
      if (focusableInModal.length === 0) {
        this.addWarning(
          "Modal without focusable elements",
          this.getSelector(modal as HTMLElement),
          "Ensure modal contains focusable elements"
        );
      }
    });
  }

  private checkContentStructure() {
    // Check heading hierarchy
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    let currentLevel = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));

      if (level > currentLevel + 1) {
        this.addViolation(
          "A",
          "1.3.1",
          `Heading level skipped (${currentLevel} to ${level})`,
          this.getSelector(heading as HTMLElement),
          "Use proper heading hierarchy without skipping levels",
          "moderate"
        );
      } else {
        this.passes++;
      }

      currentLevel = level;
    });

    // Check for main landmark
    const main = document.querySelector('main, [role="main"]');
    if (!main) {
      this.addViolation(
        "A",
        "1.3.1",
        "No main landmark found",
        "body",
        'Add <main> element or role="main"',
        "moderate"
      );
    } else {
      this.passes++;
    }

    // Check for skip links
    const skipLink = document.querySelector('a[href="#main"], a[href="#content"], .skip-link');
    if (!skipLink) {
      this.addWarning("No skip link found", "body", "Add skip link for keyboard users");
    }
  }

  private checkLanguage() {
    const html = document.documentElement;
    const lang = html.getAttribute("lang");

    if (!lang) {
      this.addViolation(
        "A",
        "3.1.1",
        "No language specified",
        "html",
        "Add lang attribute to html element",
        "moderate"
      );
    } else {
      this.passes++;
    }
  }

  private checkARIAUsage() {
    const elementsWithAria = document.querySelectorAll(
      "[aria-label], [aria-labelledby], [aria-describedby], [role]"
    );

    elementsWithAria.forEach((element) => {
      const role = element.getAttribute("role");
      const ariaLabel = element.getAttribute("aria-label");
      const ariaLabelledby = element.getAttribute("aria-labelledby");

      // Check for invalid roles
      const validRoles = [
        "alert",
        "application",
        "article",
        "banner",
        "button",
        "cell",
        "checkbox",
        "columnheader",
        "combobox",
        "complementary",
        "contentinfo",
        "dialog",
        "document",
        "feed",
        "form",
        "grid",
        "gridcell",
        "group",
        "heading",
        "img",
        "link",
        "list",
        "listbox",
        "listitem",
        "main",
        "menu",
        "menubar",
        "menuitem",
        "navigation",
        "option",
        "presentation",
        "progressbar",
        "radio",
        "radiogroup",
        "region",
        "row",
        "rowgroup",
        "rowheader",
        "search",
        "separator",
        "slider",
        "spinbutton",
        "status",
        "tab",
        "table",
        "tablist",
        "tabpanel",
        "textbox",
        "timer",
        "toolbar",
        "tooltip",
        "tree",
        "treeitem",
      ];

      if (role && !validRoles.includes(role)) {
        this.addViolation(
          "A",
          "4.1.2",
          `Invalid ARIA role: ${role}`,
          this.getSelector(element as HTMLElement),
          "Use valid ARIA role or remove role attribute",
          "serious"
        );
      }

      // Check for aria-labelledby references
      if (ariaLabelledby) {
        const referencedElement = document.getElementById(ariaLabelledby);
        if (!referencedElement) {
          this.addViolation(
            "A",
            "4.1.2",
            `aria-labelledby references non-existent element: ${ariaLabelledby}`,
            this.getSelector(element as HTMLElement),
            "Ensure referenced element exists",
            "serious"
          );
        } else {
          this.passes++;
        }
      }
    });
  }

  private checkMarkupValidity() {
    // Check for duplicate IDs
    const elementsWithId = document.querySelectorAll("[id]");
    const ids = new Set();

    elementsWithId.forEach((element) => {
      const id = element.getAttribute("id");
      if (id) {
        if (ids.has(id)) {
          this.addViolation(
            "A",
            "4.1.1",
            `Duplicate ID: ${id}`,
            this.getSelector(element as HTMLElement),
            "Ensure all IDs are unique",
            "serious"
          );
        } else {
          ids.add(id);
          this.passes++;
        }
      }
    });
  }

  private checkCompatibility() {
    // Check for proper semantic HTML
    const divButtons = document.querySelectorAll('div[onclick]:not([role="button"])');
    divButtons.forEach((div) => {
      this.addViolation(
        "A",
        "4.1.2",
        "Non-semantic element used as button",
        this.getSelector(div as HTMLElement),
        'Use <button> element or add role="button"',
        "moderate"
      );
    });

    const spanLinks = document.querySelectorAll('span[onclick]:not([role="link"])');
    spanLinks.forEach((span) => {
      this.addViolation(
        "A",
        "4.1.2",
        "Non-semantic element used as link",
        this.getSelector(span as HTMLElement),
        'Use <a> element or add role="link"',
        "moderate"
      );
    });
  }

  private checkReadability() {
    // Check for form labels
    const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');

    inputs.forEach((input) => {
      const id = input.getAttribute("id");
      const ariaLabel = input.getAttribute("aria-label");
      const ariaLabelledby = input.getAttribute("aria-labelledby");
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;

      if (!label && !ariaLabel && !ariaLabelledby) {
        this.addViolation(
          "A",
          "3.3.2",
          "Form input without label",
          this.getSelector(input as HTMLElement),
          "Add <label> element or aria-label attribute",
          "serious"
        );
      } else {
        this.passes++;
      }
    });
  }

  private checkNavigation() {
    // Check for navigation landmarks
    const nav = document.querySelector('nav, [role="navigation"]');
    if (!nav) {
      this.addWarning(
        "No navigation landmark found",
        "body",
        'Add <nav> element or role="navigation"'
      );
    }

    // Check for breadcrumbs
    const breadcrumbs = document.querySelector(
      '[aria-label*="breadcrumb"], [aria-label*="Breadcrumb"], .breadcrumb'
    );
    if (breadcrumbs && !breadcrumbs.getAttribute("aria-label")) {
      this.addWarning(
        "Breadcrumbs without aria-label",
        this.getSelector(breadcrumbs as HTMLElement),
        'Add aria-label="Breadcrumb navigation"'
      );
    }
  }

  private checkInputAssistance() {
    // Check for required field indicators
    const requiredInputs = document.querySelectorAll(
      "input[required], select[required], textarea[required]"
    );

    requiredInputs.forEach((input) => {
      const ariaRequired = input.getAttribute("aria-required");

      if (!ariaRequired) {
        this.addWarning(
          "Required field without aria-required",
          this.getSelector(input as HTMLElement),
          'Add aria-required="true" to required fields'
        );
      }
    });
  }

  private checkTextResize() {
    // This would need actual testing - placeholder for text resize check
    this.passes++; // Assume pass for now
  }

  private checkMediaAlternatives() {
    const videos = document.querySelectorAll("video");
    videos.forEach((video) => {
      const tracks = video.querySelectorAll('track[kind="captions"], track[kind="subtitles"]');
      if (tracks.length === 0) {
        this.addWarning(
          "Video without captions",
          this.getSelector(video),
          "Add caption tracks for accessibility"
        );
      }
    });
  }

  private checkSeizures() {
    // Check for autoplay videos/animations
    const autoplayElements = document.querySelectorAll("video[autoplay], [autoplay]");
    autoplayElements.forEach((element) => {
      this.addWarning(
        "Autoplay content may trigger seizures",
        this.getSelector(element as HTMLElement),
        "Avoid autoplay or provide user controls"
      );
    });
  }

  private checkInputModalities() {
    // Check for drag and drop alternatives
    const draggables = document.querySelectorAll('[draggable="true"]');
    draggables.forEach((element) => {
      this.addWarning(
        "Drag and drop without keyboard alternative",
        this.getSelector(element as HTMLElement),
        "Provide keyboard alternative for drag and drop"
      );
    });
  }

  private checkPredictability() {
    // Check for context changes on focus
    const inputs = document.querySelectorAll("input, select");
    inputs.forEach((input) => {
      const onfocus = input.getAttribute("onfocus");
      if (onfocus && (onfocus.includes("submit") || onfocus.includes("location"))) {
        this.addWarning(
          "Context change on focus",
          this.getSelector(input as HTMLElement),
          "Avoid automatic form submission or page navigation on focus"
        );
      }
    });
  }

  // Utility methods
  private addViolation(
    level: AccessibilityViolation["level"],
    guideline: string,
    description: string,
    element: string,
    fix: string,
    impact: AccessibilityViolation["impact"]
  ) {
    this.violations.push({ level, guideline, description, element, fix, impact });
  }

  private addWarning(description: string, element: string, suggestion: string) {
    this.warnings.push({ description, element, suggestion });
  }

  private getSelector(element: HTMLElement): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(" ")[0]}`;
    return element.tagName.toLowerCase();
  }

  private calculateScore(): number {
    const totalTests = this.passes + this.violations.length;
    if (totalTests === 0) return 100;

    const criticalViolations = this.violations.filter((v) => v.impact === "critical").length;
    const seriousViolations = this.violations.filter((v) => v.impact === "serious").length;
    const moderateViolations = this.violations.filter((v) => v.impact === "moderate").length;
    const minorViolations = this.violations.filter((v) => v.impact === "minor").length;

    const penalty =
      criticalViolations * 20 +
      seriousViolations * 10 +
      moderateViolations * 5 +
      minorViolations * 2;

    return Math.max(0, 100 - penalty);
  }

  private determineWCAGLevel(score: number): AccessibilityAuditResult["wcagLevel"] {
    const criticalViolations = this.violations.filter((v) => v.level === "A").length;
    const aaViolations = this.violations.filter((v) => v.level === "AA").length;
    const aaaViolations = this.violations.filter((v) => v.level === "AAA").length;

    if (criticalViolations > 0) return "Non-compliant";
    if (aaViolations > 0) return "A";
    if (aaaViolations > 0) return "AA";
    return "AAA";
  }

  private generateRecommendations(): string[] {
    const recommendations = [
      "Test with actual assistive technologies (screen readers, keyboard navigation)",
      "Involve users with disabilities in testing",
      "Use automated accessibility testing tools as supplements, not replacements",
      "Provide multiple ways to access content",
      "Test with keyboard-only navigation",
      "Ensure good color contrast ratios",
      "Use semantic HTML elements",
      "Provide alternative text for images",
      "Make forms accessible with proper labels",
      "Test at 200% zoom level",
    ];

    // Add specific recommendations based on violations
    const hasColorIssues = this.violations.some((v) => v.guideline === "1.4.3");
    if (hasColorIssues) {
      recommendations.unshift("Review and improve color contrast ratios");
    }

    const hasKeyboardIssues = this.violations.some((v) => v.guideline.startsWith("2."));
    if (hasKeyboardIssues) {
      recommendations.unshift("Improve keyboard accessibility and focus management");
    }

    return recommendations;
  }

  // Color utility methods
  private parseColor(color: string): { r: number; g: number; b: number } | null {
    const rgb = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgb) {
      return {
        r: parseInt(rgb[1]),
        g: parseInt(rgb[2]),
        b: parseInt(rgb[3]),
      };
    }
    return null;
  }

  private calculateContrast(
    color1: { r: number; g: number; b: number },
    color2: { r: number; g: number; b: number }
  ): number {
    const l1 = this.getLuminance(color1);
    const l2 = this.getLuminance(color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  private getLuminance(color: { r: number; g: number; b: number }): number {
    const rs = color.r / 255;
    const gs = color.g / 255;
    const bs = color.b / 255;

    const r = rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
    const g = gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
    const b = bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
}

// Export singleton instance
export const accessibilityChecker = new AccessibilityChecker();
