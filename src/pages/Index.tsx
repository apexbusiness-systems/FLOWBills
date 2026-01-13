import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrackLink } from "@/components/ui/TrackLink";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Zap, Shield, Clock, CheckCircle2, ArrowRight, BarChart3 } from "lucide-react";
import heroImage from "@/assets/hero-oilgas.jpg";
import { SupportChat } from "@/components/support/SupportChat";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { t } = useTranslation();
  const [isSupportMinimized, setIsSupportMinimized] = useState(true);
  
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
        aria-label={t("landing.hero.ariaLabel")}
      >
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
        <img 
          src={heroImage} 
          alt={t("landing.hero.imageAlt")} 
          className="sr-only" 
        />
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-amber-400">
            {t("hero.title")}
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-4xl mx-auto text-amber-400/90">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              asChild 
              size="lg" 
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold transition-all duration-200 hover:scale-105 active:scale-100"
            >
              <TrackLink to="/contact" source="hero" aria-label={t("landing.hero.cta.primaryAria")}>
                {t("hero.cta.primary")} <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </TrackLink>
            </Button>
            <Button 
              asChild 
              size="lg" 
              variant="outline" 
              className="bg-black/30 border-white/20 text-white hover:bg-black/50 backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-100"
            >
              <TrackLink to="/pricing" source="hero" aria-label={t("landing.hero.cta.secondaryAria")}>
                {t("hero.cta.secondary")} <BarChart3 className="ml-2 h-4 w-4" aria-hidden="true" />
              </TrackLink>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto" role="region" aria-label={t("landing.hero.stats.ariaLabel")}>
            <Card className="bg-black/40 border-white/10 backdrop-blur-md transition-all duration-300 hover:bg-black/50 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-5xl font-bold text-amber-400" aria-label={t("landing.hero.stats.processing.aria")}>95%</CardTitle>
                <CardDescription className="text-white text-base">{t("landing.hero.stats.processing.label")}</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-black/40 border-white/10 backdrop-blur-md transition-all duration-300 hover:bg-black/50 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-5xl font-bold text-amber-400" aria-label={t("landing.hero.stats.cost.aria")}>80%</CardTitle>
                <CardDescription className="text-white text-base">{t("landing.hero.stats.cost.label")}</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-black/40 border-white/10 backdrop-blur-md transition-all duration-300 hover:bg-black/50 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-5xl font-bold text-amber-400" aria-label={t("landing.hero.stats.uptime.aria")}>24/7</CardTitle>
                <CardDescription className="text-white text-base">{t("landing.hero.stats.uptime.label")}</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background" aria-labelledby="features-heading">
        <div className="container mx-auto px-4">
          <header className="text-center mb-16">
            <h2 id="features-heading" className="text-4xl font-bold mb-4">{t("landing.features.heading")}</h2>
            <p className="text-xl text-muted-foreground">{t("landing.features.description")}</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="card-enterprise hover-lift">
              <CardHeader>
                <Zap className="h-12 w-12 text-amber-500 mb-4" aria-hidden="true" />
                <CardTitle className="text-2xl mb-2">{t("landing.features.cards.ocr.title")}</CardTitle>
                <CardDescription className="text-base mb-6">{t("landing.features.cards.ocr.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{t("landing.features.cards.ocr.bullets.0")}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{t("landing.features.cards.ocr.bullets.1")}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{t("landing.features.cards.ocr.bullets.2")}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-enterprise hover-lift">
              <CardHeader>
                <Shield className="h-12 w-12 text-amber-500 mb-4" aria-hidden="true" />
                <CardTitle className="text-2xl mb-2">{t("landing.features.cards.compliance.title")}</CardTitle>
                <CardDescription className="text-base mb-6">{t("landing.features.cards.compliance.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{t("landing.features.cards.compliance.bullets.0")}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{t("landing.features.cards.compliance.bullets.1")}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{t("landing.features.cards.compliance.bullets.2")}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="card-enterprise hover-lift">
              <CardHeader>
                <Clock className="h-12 w-12 text-amber-500 mb-4" aria-hidden="true" />
                <CardTitle className="text-2xl mb-2">{t("landing.features.cards.workflow.title")}</CardTitle>
                <CardDescription className="text-base mb-6">{t("landing.features.cards.workflow.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{t("landing.features.cards.workflow.bullets.0")}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{t("landing.features.cards.workflow.bullets.1")}</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{t("landing.features.cards.workflow.bullets.2")}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-background" aria-labelledby="faq-heading">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 id="faq-heading" className="text-4xl font-bold mb-4">{t("landing.faq.heading")}</h2>
            <p className="text-xl text-muted-foreground">{t("landing.faq.subtitle")}</p>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="card-enterprise px-6">
              <AccordionTrigger className="text-left font-semibold">
                {t("landing.faq.items.0.question")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t("landing.faq.items.0.answer")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="card-enterprise px-6">
              <AccordionTrigger className="text-left font-semibold">
                {t("landing.faq.items.1.question")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t("landing.faq.items.1.answer")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="card-enterprise px-6">
              <AccordionTrigger className="text-left font-semibold">
                {t("landing.faq.items.2.question")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t("landing.faq.items.2.answer")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="card-enterprise px-6">
              <AccordionTrigger className="text-left font-semibold">
                {t("landing.faq.items.3.question")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t("landing.faq.items.3.answer")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5" className="card-enterprise px-6">
              <AccordionTrigger className="text-left font-semibold">
                {t("landing.faq.items.4.question")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t("landing.faq.items.4.answer")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6" className="card-enterprise px-6">
              <AccordionTrigger className="text-left font-semibold">
                {t("landing.faq.items.5.question")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t("landing.faq.items.5.answer")}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7" className="card-enterprise px-6">
              <AccordionTrigger className="text-left font-semibold">
                {t("landing.faq.items.6.question")}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {t("landing.faq.items.6.answer")}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-secondary/10" aria-labelledby="cta-heading">
        <div className="container mx-auto px-4 text-center max-w-4xl space-2xl">
          <h2 id="cta-heading" className="text-4xl font-bold mb-6">{t("cta.title")}</h2>
          <p className="text-xl text-muted-foreground mb-8">{t("cta.subtitle")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold transition-all duration-200 hover:scale-105 active:scale-100 min-h-[44px]">
              <TrackLink to="/contact" source="cta-bottom" aria-label={t("cta.primaryAria")}>
                {t("cta.primary")} <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </TrackLink>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-[44px]">
              <TrackLink to="/contact" source="cta-bottom" aria-label={t("cta.secondaryAria")}>
                {t("cta.secondary")}
              </TrackLink>
            </Button>
          </div>
        </div>
      </section>

      <SupportChat 
        isMinimized={isSupportMinimized} 
        onMinimize={() => setIsSupportMinimized(!isSupportMinimized)} 
      />
    </main>
  );
};

export default Index;
