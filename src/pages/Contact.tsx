import { Mail, MessageSquare, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Footer } from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);

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
          Email <a className="underline hover:text-foreground" href="mailto:hello@flowbills.ca">hello@flowbills.ca</a>. 
          CASL-compliant: we only email with consent.
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardContent className="pt-6 text-center">
              <Mail className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">Email</h3>
              <a href="mailto:hello@flowbills.ca" className="text-sm text-muted-foreground hover:text-foreground">
                hello@flowbills.ca
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <MessageSquare className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">Support</h3>
              <a href="mailto:support@flowbills.ca" className="text-sm text-muted-foreground hover:text-foreground">
                support@flowbills.ca
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Phone className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="font-semibold mb-2">Sales</h3>
              <a href="mailto:sales@flowbills.ca" className="text-sm text-muted-foreground hover:text-foreground">
                sales@flowbills.ca
              </a>
            </CardContent>
          </Card>
        </div>

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
    </div>
  );
}
