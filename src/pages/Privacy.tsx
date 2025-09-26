import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Mail, Phone, FileText, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">FlowBills.ca</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              Home
            </Button>
            <Button onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            FlowBills.ca is committed to protecting your privacy in accordance with Canadian privacy laws, 
            including PIPEDA (Personal Information Protection and Electronic Documents Act).
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            Last updated: September 25, 2025 | Effective: September 25, 2025
          </div>
        </div>

        {/* PIPEDA Compliance Notice */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              PIPEDA Compliance Statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This privacy policy complies with the Personal Information Protection and Electronic Documents Act (PIPEDA) 
              and its ten fair information principles. We collect, use, and disclose personal information only for purposes 
              that a reasonable person would consider appropriate in the circumstances.
            </p>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Table of Contents */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  <a href="#collection" className="block text-sm text-muted-foreground hover:text-primary">1. Information Collection</a>
                  <a href="#purpose" className="block text-sm text-muted-foreground hover:text-primary">2. Purpose & Use</a>
                  <a href="#consent" className="block text-sm text-muted-foreground hover:text-primary">3. Consent & CASL</a>
                  <a href="#limiting" className="block text-sm text-muted-foreground hover:text-primary">4. Limiting Collection</a>
                  <a href="#retention" className="block text-sm text-muted-foreground hover:text-primary">5. Data Retention</a>
                  <a href="#safeguards" className="block text-sm text-muted-foreground hover:text-primary">6. Safeguards</a>
                  <a href="#access" className="block text-sm text-muted-foreground hover:text-primary">7. Access Rights</a>
                  <a href="#accountability" className="block text-sm text-muted-foreground hover:text-primary">8. Accountability</a>
                  <a href="#contact" className="block text-sm text-muted-foreground hover:text-primary">9. Contact Us</a>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Policy Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Section 1: Information Collection */}
            <section id="collection">
              <Card>
                <CardHeader>
                  <CardTitle>1. Information We Collect</CardTitle>
                  <CardDescription>Personal information collected through our services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Account Information</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Full name and business contact information</li>
                      <li>Email address and phone number</li>
                      <li>Company name and role/title</li>
                      <li>Authentication credentials (encrypted)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Business Data</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Invoice and document data processed through our system</li>
                      <li>Vendor and supplier information</li>
                      <li>Purchase order details and approvals</li>
                      <li>Usage analytics and system interactions</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Technical Information</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>IP addresses and device information</li>
                      <li>Browser type and version</li>
                      <li>Session data and cookies</li>
                      <li>Security logs and audit trails</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 2: Purpose & Use */}
            <section id="purpose">
              <Card>
                <CardHeader>
                  <CardTitle>2. Purpose and Use of Information</CardTitle>
                  <CardDescription>How we use your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Primary Business Purposes</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Processing invoices and accounts payable documents</li>
                      <li>Providing AI-powered document extraction and analysis</li>
                      <li>Managing user accounts and authentication</li>
                      <li>Facilitating approval workflows and audit trails</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Secondary Purposes</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Customer support and technical assistance</li>
                      <li>System security and fraud prevention</li>
                      <li>Service improvement and analytics</li>
                      <li>Legal compliance and regulatory reporting</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Marketing Communications (with consent)</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Product updates and feature announcements</li>
                      <li>Industry insights and best practices</li>
                      <li>Event invitations and webinars</li>
                      <li>Promotional offers for additional services</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 3: Consent & CASL */}
            <section id="consent">
              <Card>
                <CardHeader>
                  <CardTitle>3. Consent and CASL Compliance</CardTitle>
                  <CardDescription>Your consent rights under Canadian anti-spam law</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Express Consent</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      We obtain your express consent before:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Sending commercial electronic messages (CEMs)</li>
                      <li>Using your information for marketing purposes</li>
                      <li>Sharing data with third-party service providers</li>
                      <li>Processing sensitive business information</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">CASL Requirements</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      All our electronic communications include:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Clear sender identification (FlowBills.ca)</li>
                      <li>Contact information for inquiries</li>
                      <li>Easy unsubscribe mechanism</li>
                      <li>Honest subject lines and content</li>
                    </ul>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Unsubscribe Rights
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      You can withdraw consent at any time by clicking "unsubscribe" in any email, 
                      contacting us directly, or updating your preferences in your account settings.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 4: Limiting Collection */}
            <section id="limiting">
              <Card>
                <CardHeader>
                  <CardTitle>4. Limiting Collection</CardTitle>
                  <CardDescription>We collect only what we need</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    FlowBills.ca adheres to the principle of data minimization. We collect personal information only when:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>It is necessary for our stated business purposes</li>
                    <li>It is collected by fair and lawful means</li>
                    <li>You have been informed of the purpose</li>
                    <li>Collection is proportionate to the service provided</li>
                  </ul>
                </CardContent>
              </Card>
            </section>

            {/* Section 5: Data Retention */}
            <section id="retention">
              <Card>
                <CardHeader>
                  <CardTitle>5. Data Retention and Disposal</CardTitle>
                  <CardDescription>How long we keep your information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Retention Periods</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div><strong>Account Data:</strong> Retained while account is active + 7 years</div>
                      <div><strong>Invoice Data:</strong> 7 years (Canadian tax requirements)</div>
                      <div><strong>Audit Logs:</strong> 7 years (regulatory compliance)</div>
                      <div><strong>Marketing Data:</strong> Until consent withdrawn + 2 years</div>
                      <div><strong>Security Logs:</strong> 2 years minimum</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Secure Disposal</h4>
                    <p className="text-sm text-muted-foreground">
                      When retention periods expire, we securely delete or anonymize personal information 
                      using industry-standard methods including cryptographic erasure and secure overwriting.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 6: Safeguards */}
            <section id="safeguards">
              <Card>
                <CardHeader>
                  <CardTitle>6. Security Safeguards</CardTitle>
                  <CardDescription>How we protect your information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Technical Safeguards</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>End-to-end encryption for data in transit and at rest</li>
                      <li>Multi-factor authentication and access controls</li>
                      <li>Regular security audits and penetration testing</li>
                      <li>Automated threat detection and monitoring</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Administrative Safeguards</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Privacy training for all employees</li>
                      <li>Role-based access controls and least privilege</li>
                      <li>Incident response and breach notification procedures</li>
                      <li>Regular policy reviews and updates</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Physical Safeguards</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Secure cloud infrastructure (Canadian data centers)</li>
                      <li>Restricted physical access to servers</li>
                      <li>Environmental controls and monitoring</li>
                      <li>Secure disposal of physical media</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 7: Access Rights */}
            <section id="access">
              <Card>
                <CardHeader>
                  <CardTitle>7. Your Access Rights</CardTitle>
                  <CardDescription>How to access and correct your information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Right to Access</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      You have the right to request access to your personal information. We will provide:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>A list of personal information we hold about you</li>
                      <li>Information about how it is used and shared</li>
                      <li>Details about third parties who have access</li>
                      <li>The source of the information if not collected directly</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Right to Correction</h4>
                    <p className="text-sm text-muted-foreground">
                      If you find inaccuracies in your personal information, we will correct them promptly 
                      and notify any third parties who received the incorrect information.
                    </p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Request Process</h4>
                    <p className="text-sm text-muted-foreground">
                      Access requests must be made in writing to our Privacy Officer. We will respond within 
                      30 days and may charge reasonable fees for extensive requests as permitted under PIPEDA.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 8: Accountability */}
            <section id="accountability">
              <Card>
                <CardHeader>
                  <CardTitle>8. Accountability</CardTitle>
                  <CardDescription>Our commitment to privacy protection</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Privacy Officer</h4>
                    <p className="text-sm text-muted-foreground">
                      Our designated Privacy Officer is responsible for ensuring compliance with this policy 
                      and applicable privacy laws. They oversee privacy impact assessments, staff training, 
                      and complaint handling.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Regular Reviews</h4>
                    <p className="text-sm text-muted-foreground">
                      We conduct annual reviews of our privacy practices and update this policy as needed 
                      to reflect changes in our services, technology, or applicable laws.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Third-Party Processors</h4>
                    <p className="text-sm text-muted-foreground">
                      We ensure all third-party service providers meet equivalent privacy protection standards 
                      through contractual agreements and regular assessments.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 9: Contact Information */}
            <section id="contact">
              <Card>
                <CardHeader>
                  <CardTitle>9. Contact Us</CardTitle>
                  <CardDescription>How to reach us about privacy matters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-semibold">Privacy Officer</div>
                          <div className="text-sm text-muted-foreground">privacy@flowbills.ca</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        <div>
                          <div className="font-semibold">Support</div>
                          <div className="text-sm text-muted-foreground">1-844-FLOWBILL</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Mailing Address</div>
                      <div className="text-sm text-muted-foreground">
                        FlowBills.ca<br />
                        Attn: Privacy Officer<br />
                        Edmonton, AB<br />
                        Canada
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Privacy Complaints</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      If you have concerns about our privacy practices, please contact us first. 
                      If not satisfied with our response, you may file a complaint with:
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <strong>Office of the Privacy Commissioner of Canada</strong><br />
                      30 Victoria Street, Gatineau, QC K1A 1H3<br />
                      Phone: 1-800-282-1376<br />
                      Website: priv.gc.ca
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;