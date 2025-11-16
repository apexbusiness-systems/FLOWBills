import React, { useEffect } from "react";
import { Brand } from "@/lib/site-config";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-oilgas.jpg";

const Index = () => {
  useEffect(() => {
    // SEO essentials
    document.title = "Invoice Automation for Energy | FLOWBills.ca";
    const desc = "Energy-grade AP automation: 95% STP, duplicate prevention, and 24/7 processing.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    if (meta) meta.content = desc;

    // Canonical
    const href = window.location.origin + "/";
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = href;
  }, []);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero with background image */}
      <section
        className="relative min-h-[80vh] flex items-center"
        style={{ backgroundImage: `url(${heroImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
        aria-label="Hero section with energy industry background"
      >
        <div className="absolute inset-0 bg-background/60" />
        <div className="relative z-10 container mx-auto px-4 py-12">
          <header className="max-w-3xl space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              {Brand?.tagline ?? "Energy-grade Invoice Automation"}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              {Brand?.subline ?? "Cut AP costs, prevent duplicates, and approve on mobile in minutes."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/contact" aria-label="Book free demo">Book Free Demo</Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link to="/pricing" aria-label="Calculate ROI">Calculate ROI</Link>
              </Button>
            </div>
          </header>

          {/* Stats */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-background/80 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="text-3xl">95%+</CardTitle>
                <CardDescription>Straight-Through Processing</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-background/80 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="text-3xl">80%</CardTitle>
                <CardDescription>AP Cost Reduction</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-background/80 backdrop-blur border-border">
              <CardHeader>
                <CardTitle className="text-3xl">24/7</CardTitle>
                <CardDescription>Processing Uptime</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust/secondary section (simple, semantic) */}
      <section className="container mx-auto px-4 py-12">
        <article className="max-w-4xl">
          <h2 className="sr-only">Why FlowBills</h2>
          <p className="text-muted-foreground">
            Built for oil & gas operations: duplicate prevention, fraud checks, mobile approvals, and
            compliance-by-default. Ship invoices faster without adding headcount.
          </p>
        </article>
      </section>
    </main>
  );
};

export default Index;
