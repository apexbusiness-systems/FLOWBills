import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrackLink } from "@/components/ui/TrackLink";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Zap, Shield, Clock, CheckCircle2, ArrowRight, BarChart3 } from "lucide-react";
import heroImage from "@/assets/hero-oilgas.jpg";

const Index = () => {
  return (
    <main className="min-h-screen animate-fade-in">
      {/* Hero Section */}
      <section 
        className="relative min-h-[85vh] flex items-center justify-center"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        aria-label="Hero section"
      >
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
        <img 
          src={heroImage} 
          alt="Oil and gas industrial facility with pipelines and equipment" 
          className="sr-only" 
        />
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            AI-Powered Invoice Processing for<br />
            <span className="text-amber-400">Canadian Oil & Gas</span>
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-4xl mx-auto text-white/90">
            Automate your accounts payable with enterprise-grade security, PIPEDA compliance,
            and intelligent duplicate detection. Built specifically for Canadian energy sector requirements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              asChild 
              size="lg" 
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold transition-all duration-200 hover:scale-105 active:scale-100"
            >
              <TrackLink to="/contact" source="hero" aria-label="Book a free demo">
                Book Free Demo <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </TrackLink>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="bg-black/30 border-white/20 text-white hover:bg-black/50 backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-100"
            >
              <TrackLink to="/pricing" source="hero" aria-label="Calculate return on investment">
                Calculate ROI <BarChart3 className="ml-2 h-4 w-4" aria-hidden="true" />
              </TrackLink>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto" role="region" aria-label="Key statistics">
            <Card className="bg-black/40 border-white/10 backdrop-blur-md transition-all duration-300 hover:bg-black/50 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-5xl font-bold text-amber-400" aria-label="95 percent">95%</CardTitle>
                <CardDescription className="text-white text-base">Straight-Through Processing</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-black/40 border-white/10 backdrop-blur-md transition-all duration-300 hover:bg-black/50 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-5xl font-bold text-amber-400" aria-label="80 percent">80%</CardTitle>
                <CardDescription className="text-white text-base">Cost Reduction</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-black/40 border-white/10 backdrop-blur-md transition-all duration-300 hover:bg-black/50 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-5xl font-bold text-amber-400" aria-label="24 hours, 7 days">24/7</CardTitle>
                <CardDescription className="text-white text-base">Processing Uptime</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background" aria-labelledby="features-heading">
        <div className="container mx-auto px-4">
          <header className="text-center mb-16">
            <h2 id="features-heading" className="text-4xl font-bold mb-4">Enterprise-Grade Features</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to modernize your accounts payable process
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="card-enterprise hover-lift">
              <CardHeader>
                <Zap className="h-12 w-12 text-amber-500 mb-4" aria-hidden="true" />
                <CardTitle className="text-2xl mb-2">AI-Powered Processing</CardTitle>
                <CardDescription className="text-base mb-6">
                  Intelligent document extraction with 99% accuracy for invoices, POs, and receipts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>OCR & Data Extraction</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Smart Field Mapping</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Multi-format Support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-enterprise hover-lift">
              <CardHeader>
                <Shield className="h-12 w-12 text-amber-500 mb-4" aria-hidden="true" />
                <CardTitle className="text-2xl mb-2">Compliance & Security</CardTitle>
                <CardDescription className="text-base mb-6">
                  PIPEDA, CASL, and SOC 2 compliance with enterprise security controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>PIPEDA Compliant</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>CASL Email Consent</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>SOC 2 Ready</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-enterprise hover-lift">
              <CardHeader>
                <Clock className="h-12 w-12 text-amber-500 mb-4" aria-hidden="true" />
                <CardTitle className="text-2xl mb-2">Smart Workflows</CardTitle>
                <CardDescription className="text-base mb-6">
                  Intelligent routing with human-in-the-loop for exception handling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Duplicate Detection</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Auto-Approval Rules</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Exception Management</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10" aria-labelledby="cta-heading">
        <div className="container mx-auto px-4 text-center max-w-4xl space-2xl">
          <h2 id="cta-heading" className="text-4xl font-bold mb-6">Ready to Transform Your AP Process?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join leading Canadian energy companies using FlowBills.ca to reduce costs and improve efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold transition-all duration-200 hover:scale-105 active:scale-100 min-h-[44px]">
              <TrackLink to="/contact" source="cta-bottom" aria-label="Start your free trial">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </TrackLink>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-[44px]">
              <TrackLink to="/contact" source="cta-bottom" aria-label="Contact our sales team">
                Contact Sales
              </TrackLink>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
