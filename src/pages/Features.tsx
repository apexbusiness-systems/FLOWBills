import { CheckCircle, Zap, Shield, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";

export default function Features() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <main className="flex-1 container mx-auto px-4 py-16 md:py-24">
        <BreadcrumbNav className="mb-8" />

        {/* Hero Section */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Enterprise-Grade Features
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
            Upload → extract → duplicate/fraud check → Human-in-the-Loop review → approve → export
            to ERP.
            <span className="text-foreground font-medium"> Canadian data residency.</span>
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 mb-24">
          <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-4">AI-Powered OCR</CardTitle>
              <CardDescription className="text-base leading-relaxed text-foreground/70">
                Extract data from invoices with 99% accuracy using advanced machine learning
                algorithms that understand complex document layouts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">
                    Multi-format support (PDF, PNG, JPG)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">Smart field mapping</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">10-second processing time</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-4">Duplicate Detection</CardTitle>
              <CardDescription className="text-base leading-relaxed text-foreground/70">
                Prevent duplicate payments with multi-dimensional fraud checks that analyze patterns
                across vendors, dates, and amounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">Hash-based matching</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">Fuzzy date/amount checks</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">Real-time alerts</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="pb-8">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl mb-4">Human-in-the-Loop</CardTitle>
              <CardDescription className="text-base leading-relaxed text-foreground/70">
                Smart routing for low-confidence invoices requiring review, ensuring accuracy while
                maximizing automation efficiency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">Auto-approve high confidence</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">Exception queue management</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm leading-relaxed">≥85% STP rate</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Compliance Section */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-12 md:p-16 border border-primary/10">
          <div className="relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Compliance & Security</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Enterprise-grade security and compliance built for Canadian regulations
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="bg-background/60 backdrop-blur rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-3 text-foreground">PIPEDA Compliant</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  All data stored in Canada with proper safeguards and access controls, ensuring
                  full compliance with federal privacy regulations.
                </p>
              </div>
              <div className="bg-background/60 backdrop-blur rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-3 text-foreground">CASL Ready</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Consent tracking and identification for all commercial electronic messages,
                  maintaining full audit trails.
                </p>
              </div>
              <div className="bg-background/60 backdrop-blur rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Row-Level Security</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  RLS enabled on all PII tables with service-role keys restricted to server-side
                  operations only.
                </p>
              </div>
              <div className="bg-background/60 backdrop-blur rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-colors duration-300">
                <h3 className="text-xl font-semibold mb-3 text-foreground">Audit Logging</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  Complete audit trail for all invoice operations and approvals with immutable
                  timestamped records.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
