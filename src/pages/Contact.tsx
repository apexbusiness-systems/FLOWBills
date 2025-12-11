import { Mail, MessageSquare, Phone, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Footer } from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { toast } from 'sonner';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { SupportChat } from '@/components/support/SupportChat';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success('Thank you! We\'ll be in touch soon.');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <BreadcrumbNav className="mb-4" />
        <h1 className="text-4xl font-bold mb-4">Contact</h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-3xl">
          Get instant support through your preferred channel. CASL-compliant: we only contact you with consent.
        </p>

        <Card className="mb-12">
          <CardContent className="pt-6">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  AI Chat
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="space-y-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">24/7 AI Support Chat</h3>
                  <p className="text-muted-foreground mb-4">
                    Get instant answers to your questions with our AI-powered support assistant
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Always Available
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Instant Response
                    </Badge>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <h4 className="font-semibold">What our AI can help with:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Product questions and feature guidance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Technical support and troubleshooting</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Account and billing inquiries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Onboarding and training assistance</span>
                    </li>
                  </ul>
                </div>

                <Button 
                  onClick={() => setIsChatMinimized(false)} 
                  className="w-full"
                  size="lg"
                >
                  Start Chat Now
                </Button>
              </TabsContent>

              <TabsContent value="email" className="space-y-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Mail className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Email Support</h3>
                  <p className="text-muted-foreground mb-4">
                    Reach out to our team via email for detailed inquiries
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      1 Business Day Response
                    </Badge>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Mail className="h-8 w-8 text-primary mb-3 mx-auto" />
                      <h4 className="font-semibold mb-2">General Inquiries</h4>
                      <a 
                        href="mailto:hello@flowbills.ca" 
                        className="text-sm text-primary hover:underline"
                      >
                        hello@flowbills.ca
                      </a>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6 text-center">
                      <MessageSquare className="h-8 w-8 text-primary mb-3 mx-auto" />
                      <h4 className="font-semibold mb-2">Technical Support</h4>
                      <a 
                        href="mailto:support@flowbills.ca" 
                        className="text-sm text-primary hover:underline"
                      >
                        support@flowbills.ca
                      </a>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Phone className="h-8 w-8 text-primary mb-3 mx-auto" />
                      <h4 className="font-semibold mb-2">Sales Team</h4>
                      <a 
                        href="mailto:sales@flowbills.ca" 
                        className="text-sm text-primary hover:underline"
                      >
                        sales@flowbills.ca
                      </a>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>CASL Compliant:</strong> We only send commercial electronic messages with your explicit consent. 
                      You can unsubscribe at any time.
                    </span>
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="phone" className="space-y-6">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Phone className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Phone Support</h3>
                  <p className="text-muted-foreground mb-4">
                    Speak directly with our support team for urgent matters
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Mon-Fri: 8am-6pm MT
                    </Badge>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-6 text-center space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Call us toll-free</p>
                    <a 
                      href="tel:1-800-FLOWBILL" 
                      className="text-3xl font-bold text-primary hover:underline"
                    >
                      1-800-FLOWBILL
                    </a>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    For after-hours emergencies, our AI chat support is available 24/7
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <h4 className="font-semibold">When to call:</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Critical system issues requiring immediate attention</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Complex technical problems needing guided support</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Account security concerns or access issues</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Enterprise consultation and custom solutions</span>
                    </li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <section className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-4">Send us a message</h2>
              <p className="text-sm text-muted-foreground mb-6">
                By submitting this form, you consent to receive commercial electronic messages from FlowBills.ca. 
                You can unsubscribe at any time.
              </p>
              
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Your Email</label>
                    <Input type="email" required placeholder="you@company.com" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Input required placeholder="How can we help?" />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea required placeholder="Tell us about your AP processing needs..." rows={6} />
                  </div>
                  
                  <Button type="submit" className="w-full">Send Message</Button>
                </form>
              ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground">We'll get back to you within 1 business day.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
      <SupportChat 
        isMinimized={isChatMinimized} 
        onMinimize={() => setIsChatMinimized(!isChatMinimized)} 
      />
    </div>
  );
}
