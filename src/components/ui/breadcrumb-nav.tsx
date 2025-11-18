import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbNavProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const routeLabels: Record<string, string> = {
  "/": "Home",
  "/features": "Features",
  "/pricing": "Pricing",
  "/about": "About Us",
  "/contact": "Contact",
  "/dashboard": "Dashboard",
  "/profile": "Profile",
  "/integrations": "Integrations",
  "/workflows": "Workflows",
  "/validation-rules": "Validation Rules",
  "/country-packs": "Country Packs",
  "/auth": "Sign In",
  "/privacy": "Privacy Policy",
  "/terms": "Terms of Service",
  "/security": "Security",
  "/api-docs": "API Documentation",
  "/client-integration": "Client Integration",
  "/supplier-portal": "Supplier Portal",
  "/csp-monitoring": "CSP Monitoring",
  "/settings/identity": "Identity Settings",
};

export function BreadcrumbNav({ items, className = "" }: BreadcrumbNavProps) {
  const location = useLocation();

  // Generate breadcrumbs from URL if not provided
  const breadcrumbs = items || generateBreadcrumbs(location.pathname);

  // Generate schema.org JSON-LD markup
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        item: `https://flowbills.ca${item.href}`,
      })),
    };

    // Add or update schema in head
    let schemaScript = document.getElementById("breadcrumb-schema") as HTMLScriptElement | null;
    if (!schemaScript) {
      schemaScript = document.createElement("script") as HTMLScriptElement;
      schemaScript.id = "breadcrumb-schema";
      schemaScript.type = "application/ld+json";
      document.head.appendChild(schemaScript);
    }
    schemaScript.textContent = JSON.stringify(schema);

    return () => {
      // Clean up on unmount
      const script = document.getElementById("breadcrumb-schema");
      if (script) {
        script.remove();
      }
    };
  }, [breadcrumbs]);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center space-x-1 text-sm text-muted-foreground ${className}`}
    >
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const isHome = item.href === "/";

          return (
            <li key={item.href} className="flex items-center">
              {index > 0 && (
                <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground/50" />
              )}
              {isLast ? (
                <span
                  className="font-medium text-foreground"
                  aria-current="page"
                >
                  {isHome ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    item.label
                  )}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="hover:text-foreground transition-colors inline-flex items-center"
                >
                  {isHome ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    item.label
                  )}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const paths = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

  let currentPath = "";
  paths.forEach((path) => {
    currentPath += `/${path}`;
    const label = routeLabels[currentPath] || formatLabel(path);
    breadcrumbs.push({ label, href: currentPath });
  });

  return breadcrumbs;
}

function formatLabel(path: string): string {
  return path
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
