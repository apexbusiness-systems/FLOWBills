import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Shield, Zap, BarChart3, Clock, ArrowRight } from 'lucide-react';
import LeadCaptureDialog from '@/components/marketing/LeadCaptureDialog';
import { useAuth } from '@/hooks/useAuth';
import heroImage from '@/assets/hero-oilgas.jpg';
import companyLogo from '@/assets/company-logo.png';

const Landing = () => {
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [captureType, setCaptureType] = useState<'demo' | 'roi_calculator' | 'contact'>('demo');
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = (type: 'demo' | 'roi_calculator' | 'contact') => {
    if (user) {
      navigate('/dashboard');
    } else {
      setCaptureType(type);
      setShowLeadCapture(true);
    }
  };

  return (
    <>
      {/* SEO Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "FlowBills",
          "description": "Professional oil & gas invoice management platform for Canadian energy companies",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web Browser",
          "offers": {
            "@type": "Offer",
            "price": "Contact for pricing",
            "priceCurrency": "CAD"
          },
          "provider": {
            "@type": "Organization",
            "name": "FlowBills.ca",
            "url": "https://flowbills.ca"
          }
        })}
      </script>
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-secondary/10 to-transparent rounded-full blur-3xl transform -translate-x-32 translate-y-32"></div>

      {/* Header */}
      <header className="relative z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={companyLogo} alt="FLOWBills.ca Logo" className="h-8 w-8 object-contain rounded-lg bg-muted" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">FlowBills.ca</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => handleCTA('contact')} className="hover:bg-primary/10">
              Contact
            </Button>
            {user ? (
              <Button onClick={() => navigate('/dashboard')} className="btn-primary shadow-lg">
                Dashboard
              </Button>
            ) : (
              <Button onClick={() => navigate('/auth')} className="btn-primary shadow-lg">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative container mx-auto px-4 py-20 text-center"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.6), rgba(0,0,0,0.3)), url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 rounded-lg"></div>
        <div className="relative z-10">
          <Badge variant="secondary" className="mb-6 bg-background/90 backdrop-blur-sm border-primary/20">
            <Shield className="h-4 w-4 mr-1" />
            PIPEDA & CASL Compliant
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            AI-Powered Invoice Processing for
            <span className="text-primary block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent drop-shadow-none">Canadian Oil & Gas</span>
          </h1>
          
          <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
            Automate your accounts payable with enterprise-grade security, PIPEDA compliance, 
            and intelligent duplicate detection. Built specifically for Canadian energy sector requirements.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" onClick={() => handleCTA('demo')} className="btn-primary text-lg px-8 py-6 hover:scale-105 transition-all duration-300">
              Book Free Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => handleCTA('roi_calculator')} className="text-lg px-8 py-6 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 hover:scale-105 transition-all duration-300">
              Calculate ROI
              <BarChart3 className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="text-3xl font-bold text-primary mb-2 drop-shadow-md">95%</div>
              <div className="text-white/90">Straight-Through Processing</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="text-3xl font-bold text-primary mb-2 drop-shadow-md">80%</div>
              <div className="text-white/90">Cost Reduction</div>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
              <div className="text-3xl font-bold text-primary mb-2 drop-shadow-md">24/7</div>
              <div className="text-white/90">Processing Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-muted/50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Enterprise-Grade Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to modernize your accounts payable process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <Zap className="h-12 w-12 text-primary mb-4" />
                <CardTitle>AI-Powered Processing</CardTitle>
                <CardDescription>
                  Intelligent document extraction with 99% accuracy for invoices, POs, and receipts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">OCR & Data Extraction</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Smart Field Mapping</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Multi-format Support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Compliance & Security</CardTitle>
                <CardDescription>
                  PIPEDA, CASL, and SOC 2 compliance with enterprise security controls
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">PIPEDA Compliant</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">CASL Email Consent</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">SOC 2 Ready</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <Clock className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Smart Workflows</CardTitle>
                <CardDescription>
                  Intelligent routing with human-in-the-loop for exception handling
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Duplicate Detection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Auto-Approval Rules</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Exception Management</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Transform Your AP Process?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join leading Canadian energy companies using FlowBills.ca to reduce costs and improve efficiency.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => handleCTA('demo')} className="text-lg px-8 py-4">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={() => handleCTA('contact')} className="text-lg px-8 py-4">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={companyLogo} alt="FLOWBills.ca Logo" className="h-6 w-6 object-contain rounded bg-muted" />
                <span className="text-lg font-bold">FlowBills.ca</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered invoice processing for Canadian energy companies.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Button variant="link" className="p-0 h-auto" onClick={() => handleCTA('demo')}>Features</Button></li>
                <li><Button variant="link" className="p-0 h-auto" onClick={() => handleCTA('demo')}>Pricing</Button></li>
                <li><Button variant="link" className="p-0 h-auto" onClick={() => handleCTA('demo')}>API</Button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Button variant="link" className="p-0 h-auto" onClick={() => handleCTA('contact')}>About</Button></li>
                <li><Button variant="link" className="p-0 h-auto" onClick={() => handleCTA('contact')}>Contact</Button></li>
                <li><Button variant="link" className="p-0 h-auto" onClick={() => navigate('/security')}>Security</Button></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Button variant="link" className="p-0 h-auto" onClick={() => navigate('/privacy')}>Privacy Policy</Button></li>
                <li><Button variant="link" className="p-0 h-auto" onClick={() => navigate('/terms')}>Terms of Service</Button></li>
                <li><Button variant="link" className="p-0 h-auto" onClick={() => navigate('/security')}>Security</Button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 FlowBills.ca. All rights reserved. Built in Edmonton, Alberta, Canada.</p>
          </div>
        </div>
      </footer>

      <LeadCaptureDialog 
        open={showLeadCapture}
        onOpenChange={setShowLeadCapture}
        interestType={captureType}
      />
      </div>
    </>
  );
};

export default Landing;