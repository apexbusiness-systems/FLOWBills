import { CheckCircle, Zap, Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/ui/footer';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';

export default function Features() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <BreadcrumbNav className="mb-4" />
        <h1 className="text-4xl font-bold mb-4">Features</h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-3xl">
          Upload → extract → duplicate/fraud check → Human-in-the-Loop review → approve → export to ERP. Canadian data residency.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <Zap className="h-12 w-12 text-primary mb-4" />
              <CardTitle>AI-Powered OCR</CardTitle>
              <CardDescription>
                Extract data from invoices with 99% accuracy using advanced machine learning.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Multi-format support (PDF, PNG, JPG)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Smart field mapping</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">10-second processing time</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Duplicate Detection</CardTitle>
              <CardDescription>
                Prevent duplicate payments with multi-dimensional fraud checks.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Hash-based matching</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Fuzzy date/amount checks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Real-time alerts</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Clock className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Human-in-the-Loop</CardTitle>
              <CardDescription>
                Smart routing for low-confidence invoices requiring review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Auto-approve high confidence</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Exception queue management</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">≥85% STP rate</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <section className="bg-muted/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Compliance & Security</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">PIPEDA Compliant</h3>
              <p className="text-sm text-muted-foreground">All data stored in Canada with proper safeguards and access controls.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">CASL Ready</h3>
              <p className="text-sm text-muted-foreground">Consent tracking and identification for all commercial electronic messages.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Row-Level Security</h3>
              <p className="text-sm text-muted-foreground">RLS enabled on all PII tables; service-role key server-side only.</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Audit Logging</h3>
              <p className="text-sm text-muted-foreground">Complete audit trail for all invoice operations and approvals.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
