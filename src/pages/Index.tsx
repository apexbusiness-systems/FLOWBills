import React, { useEffect } from "react";
import { Brand } from "@/lib/site-config";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Index = () => {
  useEffect(() => {
    document.title = "Invoice Automation for Energy | FLOWBills.ca";
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-12">
        <header className="text-center space-y-3 mb-10">
          <h1 className="text-4xl font-bold tracking-tight">{Brand.tagline}</h1>
          <p className="text-lg text-muted-foreground">{Brand.subline}</p>
        </header>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Start Trial</CardTitle>
              <CardDescription>Begin your journey with FlowBills.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="default">Get Started</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>ROI Calculator</CardTitle>
              <CardDescription>Estimate time and cost savings.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary">Calculate ROI</Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
};

export default Index;