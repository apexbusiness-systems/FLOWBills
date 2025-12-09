import { Code, Key, Webhook } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { TrackLink } from "@/components/ui/TrackLink";
import { Button } from "@/components/ui/button";

export default function APIDocs() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">API</h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-3xl">
          REST & webhooks. OAuth coming later. Contact us for early access to our comprehensive API.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <Code className="h-12 w-12 text-primary mb-4" />
              <CardTitle>REST API</CardTitle>
              <CardDescription>Full programmatic access to invoice processing</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Upload invoices via API</li>
                <li>• Query processing status</li>
                <li>• Retrieve extracted data</li>
                <li>• Manage approvals</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Webhook className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Real-time notifications for events</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Invoice processed</li>
                <li>• Duplicate detected</li>
                <li>• Manual review needed</li>
                <li>• Approval completed</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Key className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Authentication</CardTitle>
              <CardDescription>Secure API key management</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• API key authentication</li>
                <li>• Rate limiting</li>
                <li>• OAuth (coming soon)</li>
                <li>• Audit logging</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <section className="bg-muted/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Documentation</h2>
          <p className="text-muted-foreground mb-4">
            Full API documentation is available to customers. Contact us for early access or see our
            OpenAPI schema.
          </p>
          <div className="flex gap-4">
            <TrackLink to="/contact" source="api-docs-access">
              <Button>Request Access</Button>
            </TrackLink>
            <TrackLink to="/contact" source="api-docs-schema">
              <Button variant="outline">View Schema (Soon)</Button>
            </TrackLink>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
