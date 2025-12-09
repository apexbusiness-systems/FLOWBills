import { Building2, MapPin, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/ui/footer";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <BreadcrumbNav className="mb-4" />
        <h1 className="text-4xl font-bold mb-4">About</h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-3xl">
          We build Canadian-first AP automation for energy operators and service companies.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardContent className="pt-6">
              <Building2 className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Built for Energy</h3>
              <p className="text-sm text-muted-foreground">
                Designed specifically for Canadian oil & gas operators with industry-specific
                workflows and compliance requirements.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <MapPin className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Edmonton-Based</h3>
              <p className="text-sm text-muted-foreground">
                Proudly based in Alberta's energy capital, we understand the unique needs of
                Canadian energy companies.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Customer First</h3>
              <p className="text-sm text-muted-foreground">
                We work directly with operators to ensure our platform meets real-world AP
                processing needs.
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="bg-muted/50 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            FlowBills.ca was created to modernize accounts payable processing in the Canadian energy
            sector. We combine AI-powered automation with human expertise to deliver secure,
            compliant, and efficient invoice processing that reduces costs while maintaining the
            highest standards of accuracy and security.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Why FlowBills?</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold mb-1">Canadian Data Residency</h3>
              <p className="text-sm text-muted-foreground">
                All data stored and processed within Canada, ensuring PIPEDA compliance.
              </p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold mb-1">Industry Expertise</h3>
              <p className="text-sm text-muted-foreground">
                Built by people who understand oil & gas operations and regulatory requirements.
              </p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <h3 className="font-semibold mb-1">Production-Grade Security</h3>
              <p className="text-sm text-muted-foreground">
                RLS policies, SBOM generation, and comprehensive audit logging from day one.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
