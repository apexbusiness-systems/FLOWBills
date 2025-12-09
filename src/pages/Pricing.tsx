import { useState } from "react";
import { Check, Calculator } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Footer } from "@/components/ui/footer";
import { TrackLink } from "@/components/ui/TrackLink";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import {
  PRICING_PLANS,
  calculateMonthlyBill,
  formatCurrency,
  getRecommendedPlan,
} from "@/lib/constants/pricing";

export default function Pricing() {
  const [invoiceVolume, setInvoiceVolume] = useState(2000);

  const starterCalc = calculateMonthlyBill("STARTER", invoiceVolume);
  const growthCalc = calculateMonthlyBill("GROWTH", invoiceVolume);
  const recommended = getRecommendedPlan(invoiceVolume);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <BreadcrumbNav className="mb-6" />
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Simple, Volume-Based Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            No per-seat charges. Pay based on invoice volume. Unlimited internal users and vendor
            access included.
          </p>
        </div>

        {/* Calculator Section */}
        <Card className="mb-16 border-2 border-primary/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calculator className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Pricing Calculator</CardTitle>
            </div>
            <CardDescription>Estimate your monthly cost based on invoice volume</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="volume" className="text-base">
                  Expected Monthly Invoices
                </Label>
                <Input
                  id="volume"
                  type="number"
                  value={invoiceVolume}
                  onChange={(e) => setInvoiceVolume(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-32 text-right"
                  min="0"
                  step="100"
                />
              </div>
              <Slider
                value={[invoiceVolume]}
                onValueChange={(value) => setInvoiceVolume(value[0])}
                max={10000}
                step={100}
                className="w-full"
              />
            </div>

            {/* Calculator Results */}
            <div className="grid md:grid-cols-2 gap-6 pt-6 border-t">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Starter Plan
                  {recommended.plan_id === "STARTER" && (
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                      Recommended
                    </span>
                  )}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price:</span>
                    <span className="font-medium">
                      {formatCurrency(starterCalc.base_price_cents)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Included Invoices:</span>
                    <span>{PRICING_PLANS.STARTER.included_invoices.toLocaleString()}</span>
                  </div>
                  {starterCalc.overage_count > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Overage ({starterCalc.overage_count}):
                        </span>
                        <span className="font-medium">
                          {formatCurrency(starterCalc.overage_price_cents)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between pt-2 border-t font-bold text-base">
                    <span>Total:</span>
                    <span className="text-primary">
                      {formatCurrency(starterCalc.total_price_cents)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Growth Plan
                  {recommended.plan_id === "GROWTH" && (
                    <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                      Recommended
                    </span>
                  )}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base Price:</span>
                    <span className="font-medium">
                      {formatCurrency(growthCalc.base_price_cents)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Included Invoices:</span>
                    <span>{PRICING_PLANS.GROWTH.included_invoices.toLocaleString()}</span>
                  </div>
                  {growthCalc.overage_count > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Overage ({growthCalc.overage_count}):
                        </span>
                        <span className="font-medium">
                          {formatCurrency(growthCalc.overage_price_cents)}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between pt-2 border-t font-bold text-base">
                    <span>Total:</span>
                    <span className="text-primary">
                      {formatCurrency(growthCalc.total_price_cents)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {recommended.plan_id && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <p className="text-sm">
                  <strong>💡 Recommendation:</strong> {recommended.reason}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Starter Plan */}
          <Card className="relative flex flex-col">
            <CardHeader>
              <CardTitle className="text-3xl">Starter</CardTitle>
              <CardDescription className="text-base">
                Perfect for small to medium teams getting started with automation
              </CardDescription>
              <div className="pt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">
                    {formatCurrency(PRICING_PLANS.STARTER.base_price_cents)}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Includes up to {PRICING_PLANS.STARTER.included_invoices.toLocaleString()}{" "}
                  invoices/month
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(PRICING_PLANS.STARTER.overage_price_per_invoice_cents)} per
                  additional invoice
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Unlimited internal users</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Unlimited vendor view-only access</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>AI-powered OCR extraction</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Duplicate & fraud detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Human-in-the-loop review queue</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>ERP export (CSV, JSON)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Email support (24h response)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>99.5% uptime SLA</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <TrackLink to="/auth" source="pricing-starter">
                <Button className="w-full" size="lg" variant="outline">
                  Start Free Trial
                </Button>
              </TrackLink>
            </CardFooter>
          </Card>

          {/* Growth Plan */}
          <Card className="relative flex flex-col border-2 border-primary shadow-xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                MOST POPULAR
              </span>
            </div>
            <CardHeader>
              <CardTitle className="text-3xl">Growth</CardTitle>
              <CardDescription className="text-base">
                For growing businesses with higher invoice volumes
              </CardDescription>
              <div className="pt-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold">
                    {formatCurrency(PRICING_PLANS.GROWTH.base_price_cents)}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Includes up to {PRICING_PLANS.GROWTH.included_invoices.toLocaleString()}{" "}
                  invoices/month
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(PRICING_PLANS.GROWTH.overage_price_per_invoice_cents)} per
                  additional invoice
                </p>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong>Everything in Starter</strong>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Lower overage rate ($0.20/invoice)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>E-invoicing (Peppol/EN16931)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Country packs (CA, US, EU, UK)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Custom approval workflows</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Advanced fraud analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Priority support (4h response)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>99.9% uptime SLA</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>Dedicated account manager</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <TrackLink to="/contact" source="pricing-growth">
                <Button className="w-full" size="lg">
                  Contact Sales
                </Button>
              </TrackLink>
            </CardFooter>
          </Card>
        </div>

        {/* Enterprise Section */}
        <Card className="mb-16 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Enterprise</CardTitle>
            <CardDescription className="text-base">
              Custom solutions for high-volume operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <h4 className="font-semibold mb-2">Volume Discounts</h4>
                <p className="text-sm text-muted-foreground">
                  Significant savings for 10k+ invoices/month
                </p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold mb-2">Custom Integrations</h4>
                <p className="text-sm text-muted-foreground">
                  API access, custom connectors, dedicated infrastructure
                </p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold mb-2">White-Glove Support</h4>
                <p className="text-sm text-muted-foreground">
                  24/7 phone support, implementation assistance, training
                </p>
              </div>
            </div>
            <div className="text-center">
              <TrackLink to="/contact" source="pricing-enterprise">
                <Button size="lg" variant="outline">
                  Schedule Enterprise Demo
                </Button>
              </TrackLink>
            </div>
          </CardContent>
        </Card>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Do you charge per user?</h3>
              <p className="text-muted-foreground">
                No. All internal team members and vendor portal users are included at no additional
                cost. You only pay based on invoice volume processed.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">What counts as an "invoice processed"?</h3>
              <p className="text-muted-foreground">
                Any invoice uploaded and run through our OCR extraction pipeline counts toward your
                monthly limit. Drafts, deleted invoices, and failed uploads do not count.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-muted-foreground">
                Yes. Changes take effect at the start of your next billing cycle. If you exceed your
                plan's included volume, overage charges apply automatically.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards via Stripe. Enterprise customers can arrange
                ACH/wire transfers and annual invoicing.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground">
                Yes. All plans include a 14-day free trial with full feature access. No credit card
                required to start.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
