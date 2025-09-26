import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, CheckCircle, AlertTriangle, FileText, Server, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Security = () => {
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
          <h1 className="text-4xl font-bold text-foreground mb-4">Security & Compliance</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Enterprise-grade security designed for Canadian oil & gas companies handling sensitive financial data.
          </p>
          
          {/* Compliance Badges */}
          <div className="flex flex-wrap justify-center gap-4 mt-8">
            <Badge variant="outline" className="px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              SOC 2 Type II Ready
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <CheckCircle className="h-4 w-4 mr-2" />
              PIPEDA Compliant
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Eye className="h-4 w-4 mr-2" />
              CASL Compliant
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              <Lock className="h-4 w-4 mr-2" />
              ISO 27001 Aligned
            </Badge>
          </div>
        </div>

        {/* Security Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                Data Encryption
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• AES-256 encryption at rest</li>
                <li>• TLS 1.3 for data in transit</li>
                <li>• End-to-end encrypted backups</li>
                <li>• Key rotation every 90 days</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Access Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Multi-factor authentication</li>
                <li>• Role-based permissions</li>
                <li>• Zero-trust architecture</li>
                <li>• Session timeout controls</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Infrastructure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Canadian data centers only</li>
                <li>• 99.9% uptime SLA</li>
                <li>• Automated failover</li>
                <li>• Real-time monitoring</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Security Sections */}
        <div className="space-y-8">
          {/* Data Protection */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Data Protection & Privacy</CardTitle>
                <CardDescription>
                  Comprehensive data protection aligned with Canadian privacy laws
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" />
                      PIPEDA Compliance
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Consent-based data collection</li>
                      <li>• Purpose limitation and minimization</li>
                      <li>• Data subject access rights</li>
                      <li>• Breach notification procedures</li>
                      <li>• Cross-border transfer safeguards</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      Data Governance
                    </h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Data classification and labeling</li>
                      <li>• Retention policy enforcement</li>
                      <li>• Audit trail for all access</li>
                      <li>• Data loss prevention (DLP)</li>
                      <li>• Regular compliance assessments</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Technical Security */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Technical Security Controls</CardTitle>
                <CardDescription>
                  Multi-layered security architecture protecting your data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Application Security</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• OWASP ASVS Level 2 compliance</li>
                      <li>• Regular security code reviews</li>
                      <li>• Automated vulnerability scanning</li>
                      <li>• Penetration testing quarterly</li>
                      <li>• Secure development lifecycle</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Infrastructure Security</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Web Application Firewall (WAF)</li>
                      <li>• DDoS protection and mitigation</li>
                      <li>• Intrusion detection systems</li>
                      <li>• Network segmentation</li>
                      <li>• Container security scanning</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Compliance & Certifications */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Compliance & Certifications</CardTitle>
                <CardDescription>
                  Meeting industry standards and regulatory requirements
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <h4 className="font-semibold mb-2">SOC 2 Type II</h4>
                    <p className="text-sm text-muted-foreground">
                      Security, availability, and confidentiality controls audited annually
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Shield className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                    <h4 className="font-semibold mb-2">ISO 27001</h4>
                    <p className="text-sm text-muted-foreground">
                      Information security management system aligned with international standards
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Eye className="h-12 w-12 text-purple-500 mx-auto mb-3" />
                    <h4 className="font-semibold mb-2">PIPEDA/CASL</h4>
                    <p className="text-sm text-muted-foreground">
                      Full compliance with Canadian privacy and anti-spam legislation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Security Operations */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Security Operations</CardTitle>
                <CardDescription>
                  24/7 monitoring and incident response capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Monitoring & Detection</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Security Information and Event Management (SIEM)</li>
                      <li>• Real-time threat intelligence</li>
                      <li>• Automated anomaly detection</li>
                      <li>• User behavior analytics</li>
                      <li>• Log aggregation and analysis</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Incident Response</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• 24/7 security operations center</li>
                      <li>• Defined incident response procedures</li>
                      <li>• Automated containment and remediation</li>
                      <li>• Customer notification within 24 hours</li>
                      <li>• Post-incident analysis and improvements</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Business Continuity */}
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Business Continuity & Disaster Recovery</CardTitle>
                <CardDescription>
                  Ensuring service availability and data protection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Backup & Recovery</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Automated daily backups</li>
                      <li>• Point-in-time recovery capability</li>
                      <li>• Geo-redundant storage</li>
                      <li>• Regular recovery testing</li>
                      <li>• RTO: 4 hours, RPO: 1 hour</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">High Availability</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Multi-region deployment</li>
                      <li>• Load balancing and failover</li>
                      <li>• Database replication</li>
                      <li>• CDN for global performance</li>
                      <li>• 99.9% uptime SLA</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Security Contact */}
          <section>
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                  Security Contact & Reporting
                </CardTitle>
                <CardDescription>
                  Report security issues or request security information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Security Team</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div><strong>Email:</strong> security@flowbills.ca</div>
                      <div><strong>Phone:</strong> 1-844-FLOWBILL</div>
                      <div><strong>Response Time:</strong> Within 24 hours</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Vulnerability Disclosure</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>We welcome responsible disclosure of security vulnerabilities.</div>
                      <div>Email: security@flowbills.ca</div>
                      <div>PGP Key: Available upon request</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Security Documentation</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Additional security documentation available to enterprise customers:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">SOC 2 Reports</Badge>
                    <Badge variant="outline">Penetration Test Results</Badge>
                    <Badge variant="outline">Security Architecture</Badge>
                    <Badge variant="outline">Data Processing Agreements</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Questions About Our Security?
          </h2>
          <p className="text-muted-foreground mb-6">
            Our security team is available to discuss your specific requirements
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={() => window.location.href = 'mailto:security@flowbills.ca'}>
              Contact Security Team
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;