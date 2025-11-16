import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 text-foreground">
          Invoice Automation for Energy
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Streamline your AP process with 95% straight-through processing, duplicate prevention, and 24/7 automation
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link to="/contact">Book Demo</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/pricing">View Pricing</Link>
          </Button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-4xl text-primary">95%+</CardTitle>
              <CardDescription>Straight-Through Processing</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-4xl text-primary">80%</CardTitle>
              <CardDescription>Cost Reduction</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-4xl text-primary">24/7</CardTitle>
              <CardDescription>Automated Processing</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
