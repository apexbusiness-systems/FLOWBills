import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Shield, Zap, BarChart3, FileText, Clock, ArrowRight } from 'lucide-react';
import LeadCaptureDialog from '@/components/marketing/LeadCaptureDialog';
import { useAuth } from '@/hooks/useAuth';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">FlowBills.ca</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => handleCTA('contact')}>
              Contact
            </Button>
            {user ? (
              <Button onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
            ) : (
              <Button onClick={() => navigate('/auth')}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="secondary" className="mb-6">
          <Shield className="h-4 w-4 mr-1" />
          PIPEDA & CASL Compliant
        </Badge>
        
        <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
          AI-Powered Invoice Processing for
          <span className="text-primary block">Canadian Oil & Gas</span>
        </h1>
        
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
          Automate your accounts payable with enterprise-grade security, PIPEDA compliance, 
          and intelligent duplicate detection. Built specifically for Canadian energy sector requirements.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" onClick={() => handleCTA('demo')} className="text-lg px-8 py-6">
            Book Free Demo
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => handleCTA('roi_calculator')} className="text-lg px-8 py-6">
            Calculate ROI
            <BarChart3 className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">95%</div>
            <div className="text-muted-foreground">Straight-Through Processing</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">80%</div>
            <div className="text-muted-foreground">Cost Reduction</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">24/7</div>
            <div className="text-muted-foreground">Processing Uptime</div>
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
                <FileText className="h-6 w-6 text-primary" />
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
  );
};

export default Landing;