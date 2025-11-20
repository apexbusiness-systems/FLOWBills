import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/ui/NavLink";
import { TrackLink } from "@/components/ui/TrackLink";
import { cn } from "@/lib/utils";
import companyLogo from "@/assets/company-logo.png";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useTranslation } from "react-i18next";

/**
 * Persistent header for public pages
 * Responsive navigation with mobile menu and prominent CTAs
 */
export const PublicHeader = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const navItems = [
    { label: t("nav.features"), to: "/features" },
    { label: t("nav.pricing"), to: "/pricing" },
    { label: t("nav.about"), to: "/about" },
    { label: t("nav.contact"), to: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <NavLink 
            to="/" 
            end
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            activeClassName=""
          >
            <img 
              src={companyLogo} 
              alt="FlowBills Logo" 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-foreground">
              Flow<span className="text-primary">Bills</span>
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                activeClassName="text-foreground font-semibold"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher />
            <Button asChild variant="ghost" size="sm">
              <TrackLink to="/auth" source="header">
                {t("nav.signIn")}
              </TrackLink>
            </Button>
            <Button asChild size="sm" className="min-h-[44px]">
              <TrackLink to="/contact" source="header">
                {t("nav.getStarted")}
              </TrackLink>
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden min-h-[44px] min-w-[44px]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav 
            id="mobile-menu"
            className="md:hidden pb-4 animate-fade-in"
            aria-label="Mobile navigation"
          >
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors min-h-[44px] flex items-center"
                  activeClassName="text-foreground bg-muted font-semibold"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
              <div className="flex flex-col gap-2 px-4 pt-4 border-t border-border mt-2">
                <Button asChild variant="outline" className="w-full min-h-[44px]">
                  <TrackLink to="/auth" source="mobile-header">
                    Sign In
                  </TrackLink>
                </Button>
                <Button asChild className="w-full min-h-[44px]">
                  <TrackLink to="/contact" source="mobile-header">
                    Book Demo
                  </TrackLink>
                </Button>
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
