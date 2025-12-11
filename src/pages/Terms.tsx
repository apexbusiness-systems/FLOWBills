import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Scale, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Terms = () => {
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
            <Scale className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            These terms govern your use of FlowBills.ca services, including CASL compliance requirements 
            for electronic communications and commercial messaging.
          </p>
          <div className="mt-4 text-sm text-muted-foreground">
            Last updated: September 25, 2025 | Effective: September 25, 2025
          </div>
        </div>

        {/* CASL Compliance Notice */}
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              CASL Compliance Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              By using FlowBills.ca services, you consent to receive commercial electronic messages from us. 
              All communications include sender identification, contact information, and unsubscribe mechanisms 
              as required by Canada's Anti-Spam Legislation (CASL).
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
                  <a href="#acceptance" className="block text-sm text-muted-foreground hover:text-primary">1. Acceptance of Terms</a>
                  <a href="#services" className="block text-sm text-muted-foreground hover:text-primary">2. Service Description</a>
                  <a href="#account" className="block text-sm text-muted-foreground hover:text-primary">3. Account Responsibilities</a>
                  <a href="#casl" className="block text-sm text-muted-foreground hover:text-primary">4. CASL Consent</a>
                  <a href="#acceptable-use" className="block text-sm text-muted-foreground hover:text-primary">5. Acceptable Use</a>
                  <a href="#data" className="block text-sm text-muted-foreground hover:text-primary">6. Data & Privacy</a>
                  <a href="#intellectual" className="block text-sm text-muted-foreground hover:text-primary">7. Intellectual Property</a>
                  <a href="#liability" className="block text-sm text-muted-foreground hover:text-primary">8. Limitation of Liability</a>
                  <a href="#termination" className="block text-sm text-muted-foreground hover:text-primary">9. Termination</a>
                  <a href="#governing-law" className="block text-sm text-muted-foreground hover:text-primary">10. Governing Law</a>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Terms Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Section 1: Acceptance */}
            <section id="acceptance">
              <Card>
                <CardHeader>
                  <CardTitle>1. Acceptance of Terms</CardTitle>
                  <CardDescription>Agreement to these terms of service</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    By accessing or using FlowBills.ca ("Service"), operated by FlowBills.ca ("Company", "we", "us", or "our"), 
                    you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, 
                    you may not access the Service.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    These Terms apply to all visitors, users, and others who access or use the Service. 
                    By accessing the Service, you represent that you are at least 18 years old and have the legal capacity 
                    to enter into this agreement.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Section 2: Services */}
            <section id="services">
              <Card>
                <CardHeader>
                  <CardTitle>2. Service Description</CardTitle>
                  <CardDescription>What FlowBills.ca provides</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Core Services</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>AI-powered invoice processing and data extraction</li>
                      <li>Automated accounts payable workflows</li>
                      <li>Duplicate detection and fraud prevention</li>
                      <li>Approval routing and exception management</li>
                      <li>Compliance monitoring and reporting</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Service Availability</h4>
                    <p className="text-sm text-muted-foreground">
                      We strive to provide 99.9% uptime but do not guarantee uninterrupted service. 
                      Planned maintenance will be communicated in advance when possible.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Service Modifications</h4>
                    <p className="text-sm text-muted-foreground">
                      We reserve the right to modify, suspend, or discontinue any part of the Service 
                      with reasonable notice to users.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 3: Account Responsibilities */}
            <section id="account">
              <Card>
                <CardHeader>
                  <CardTitle>3. Account Responsibilities</CardTitle>
                  <CardDescription>Your obligations as a user</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Account Security</h4>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                      <li>You must notify us immediately of any unauthorized use of your account</li>
                      <li>You are liable for all activities that occur under your account</li>
                      <li>Use strong passwords and enable multi-factor authentication when available</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Accurate Information</h4>
                    <p className="text-sm text-muted-foreground">
                      You agree to provide accurate, current, and complete information during registration 
                      and to update such information to keep it accurate, current, and complete.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Business Use</h4>
                    <p className="text-sm text-muted-foreground">
                      FlowBills.ca is intended for business use. You represent that you have the authority 
                      to bind your organization to these Terms.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 4: CASL Consent */}
            <section id="casl">
              <Card>
                <CardHeader>
                  <CardTitle>4. CASL Consent and Electronic Communications</CardTitle>
                  <CardDescription>Consent for commercial electronic messages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Express Consent</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      By creating an account or subscribing to our services, you provide express consent to receive 
                      commercial electronic messages (CEMs) from FlowBills.ca, including:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Service notifications and account updates</li>
                      <li>System alerts and security notifications</li>
                      <li>Product updates and feature announcements</li>
                      <li>Invoice processing confirmations and alerts</li>
                      <li>Educational content and best practices</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Sender Identification</h4>
                    <p className="text-sm text-muted-foreground">
                      All electronic communications will clearly identify FlowBills.ca as the sender and include 
                      our contact information as required by CASL.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Unsubscribe Rights</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      You may withdraw consent at any time by:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Clicking "unsubscribe" in any marketing email</li>
                      <li>Updating your communication preferences in your account settings</li>
                      <li>Contacting us at support@flowbills.ca</li>
                      <li>Calling 1-844-FLOWBILL</li>
                    </ul>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Important Note</h4>
                    <p className="text-sm text-muted-foreground">
                      Even if you unsubscribe from marketing communications, you will continue to receive 
                      essential service-related messages necessary for your use of FlowBills.ca.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 5: Acceptable Use */}
            <section id="acceptable-use">
              <Card>
                <CardHeader>
                  <CardTitle>5. Acceptable Use Policy</CardTitle>
                  <CardDescription>Prohibited activities and conduct</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Prohibited Uses</h4>
                    <p className="text-sm text-muted-foreground mb-2">You may not use the Service:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                      <li>To violate any international, federal, provincial, or local regulations or laws</li>
                      <li>To transmit, or procure the sending of, any advertising or promotional material without consent</li>
                      <li>To impersonate or attempt to impersonate the Company, employees, or other users</li>
                      <li>To engage in any other conduct that restricts or inhibits anyone's use of the Service</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Security Violations</h4>
                    <p className="text-sm text-muted-foreground mb-2">You may not:</p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Attempt to gain unauthorized access to any portion of the Service</li>
                      <li>Use any automated system to access the Service in a manner that sends more requests than a human can produce</li>
                      <li>Introduce any viruses, trojan horses, worms, logic bombs, or other malicious material</li>
                      <li>Attempt to interfere with, compromise, or reverse engineer any Service components</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Data Usage</h4>
                    <p className="text-sm text-muted-foreground">
                      You may only upload and process data that you own or have explicit permission to use. 
                      You are responsible for ensuring your data complies with applicable laws and regulations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 6: Data & Privacy */}
            <section id="data">
              <Card>
                <CardHeader>
                  <CardTitle>6. Data Protection and Privacy</CardTitle>
                  <CardDescription>How we handle your data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Data Processing</h4>
                    <p className="text-sm text-muted-foreground">
                      We process your data in accordance with our Privacy Policy and applicable Canadian privacy laws, 
                      including PIPEDA. By using the Service, you consent to such processing.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Data Ownership</h4>
                    <p className="text-sm text-muted-foreground">
                      You retain all rights, title, and interest in your data. We do not claim ownership 
                      of any content you submit, upload, or display on or through the Service.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Data Security</h4>
                    <p className="text-sm text-muted-foreground">
                      We implement appropriate technical and organizational measures to protect your data, 
                      but cannot guarantee absolute security. See our Security page for detailed information.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Data Portability</h4>
                    <p className="text-sm text-muted-foreground">
                      Upon request, we will provide your data in a standard, machine-readable format 
                      to facilitate transfer to another service provider.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 7: Intellectual Property */}
            <section id="intellectual">
              <Card>
                <CardHeader>
                  <CardTitle>7. Intellectual Property Rights</CardTitle>
                  <CardDescription>Rights and ownership of Service content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Service Content</h4>
                    <p className="text-sm text-muted-foreground">
                      The Service and its original content, features, and functionality are and will remain 
                      the exclusive property of FlowBills.ca and its licensors. The Service is protected by 
                      copyright, trademark, and other laws.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">User Content</h4>
                    <p className="text-sm text-muted-foreground">
                      You grant us a limited, non-exclusive, transferable license to use your content 
                      solely for the purpose of providing the Service to you.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Trademarks</h4>
                    <p className="text-sm text-muted-foreground">
                      FlowBills.ca and related marks are trademarks of FlowBills.ca. 
                      You may not use these marks without our prior written consent.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 8: Limitation of Liability */}
            <section id="liability">
              <Card>
                <CardHeader>
                  <CardTitle>8. Limitation of Liability</CardTitle>
                  <CardDescription>Limits on our liability to you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Service Availability</h4>
                    <p className="text-sm text-muted-foreground">
                      The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, 
                      expressed or implied, regarding the Service's availability, reliability, or suitability 
                      for your particular use.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Limitation of Damages</h4>
                    <p className="text-sm text-muted-foreground">
                      In no event shall FlowBills.ca, its directors, employees, partners, agents, suppliers, 
                      or affiliates be liable for any indirect, incidental, special, consequential, or punitive 
                      damages, including loss of profits, data, use, goodwill, or other intangible losses.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Maximum Liability</h4>
                    <p className="text-sm text-muted-foreground">
                      Our total liability to you for all damages shall not exceed the amount paid by you 
                      to FlowBills.ca in the twelve (12) months preceding the claim.
                    </p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Provincial Variations</h4>
                    <p className="text-sm text-muted-foreground">
                      Some provinces do not allow the exclusion or limitation of incidental or consequential damages, 
                      so the above limitation may not apply to you.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 9: Termination */}
            <section id="termination">
              <Card>
                <CardHeader>
                  <CardTitle>9. Termination</CardTitle>
                  <CardDescription>How this agreement can end</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Termination by You</h4>
                    <p className="text-sm text-muted-foreground">
                      You may terminate your account at any time by contacting us or using the account 
                      closure feature in your dashboard. Termination will be effective immediately.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Termination by Us</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      We may terminate or suspend your account immediately, without prior notice, for:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                      <li>Breach of these Terms</li>
                      <li>Non-payment of fees</li>
                      <li>Violation of our Acceptable Use Policy</li>
                      <li>Suspected fraudulent or illegal activity</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Effects of Termination</h4>
                    <p className="text-sm text-muted-foreground">
                      Upon termination, your right to use the Service will cease immediately. 
                      We will retain your data for 30 days to allow for account recovery, 
                      after which it will be permanently deleted.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section 10: Governing Law */}
            <section id="governing-law">
              <Card>
                <CardHeader>
                  <CardTitle>10. Governing Law and Jurisdiction</CardTitle>
                  <CardDescription>Legal framework for these terms</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Applicable Law</h4>
                    <p className="text-sm text-muted-foreground">
                      These Terms shall be interpreted and governed by the laws of the Province of Alberta 
                      and the federal laws of Canada applicable therein, without regard to conflict of law provisions.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Jurisdiction</h4>
                    <p className="text-sm text-muted-foreground">
                      Any disputes arising out of or relating to these Terms or the Service shall be subject 
                      to the exclusive jurisdiction of the courts of Alberta, Canada.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Dispute Resolution</h4>
                    <p className="text-sm text-muted-foreground">
                      We encourage resolving disputes through direct communication. If a dispute cannot be 
                      resolved informally, we agree to binding arbitration under the Arbitration Act of Alberta.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Changes to Terms</h4>
                    <p className="text-sm text-muted-foreground">
                      We reserve the right to modify these Terms at any time. Changes will be effective 
                      immediately upon posting. Your continued use of the Service constitutes acceptance 
                      of the revised Terms.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Contact Information */}
            <section>
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                  <CardDescription>How to reach us regarding these terms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div><strong>Email:</strong> legal@flowbills.ca</div>
                    <div><strong>Phone:</strong> 1-844-FLOWBILL</div>
                    <div><strong>Address:</strong> Edmonton, AB, Canada</div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      If you have questions about these Terms of Service, please contact us using the information above.
                    </p>
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

export default Terms;