import { useState, useMemo } from 'react';
import { Search, BookOpen, Video, Lightbulb, ChevronRight, Play, Check, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BreadcrumbNav } from '@/components/ui/breadcrumb-nav';
import { useTour } from '@/hooks/useTour';

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
}

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  videoId: string;
  category: string;
}

interface Guide {
  id: string;
  title: string;
  description: string;
  steps: Array<{ title: string; content: string }>;
  category: string;
}

const articles: Article[] = [
  {
    id: '1',
    title: 'Getting Started with FlowBills',
    description: 'Learn the basics of invoice automation and processing',
    category: 'Getting Started',
    content: 'FlowBills is an AI-powered invoice processing system designed for Canadian oil & gas operations. This guide will walk you through the initial setup and core features.',
    tags: ['basics', 'setup', 'onboarding']
  },
  {
    id: '2',
    title: 'Invoice Upload Best Practices',
    description: 'Optimize your invoice uploads for faster processing',
    category: 'Best Practices',
    content: 'For best results, ensure invoices are in PDF or image format with clear text. Multi-page documents are supported. High-quality scans improve OCR accuracy.',
    tags: ['upload', 'optimization', 'tips']
  },
  {
    id: '3',
    title: 'Understanding Validation Rules',
    description: 'Configure custom validation rules for your workflow',
    category: 'Features',
    content: 'Validation rules help ensure invoice accuracy before approval. You can set thresholds for amounts, vendor matching, PO verification, and duplicate detection.',
    tags: ['validation', 'rules', 'configuration']
  },
  {
    id: '4',
    title: 'Managing Vendor Data',
    description: 'Add and manage vendor information',
    category: 'Features',
    content: 'Maintain an accurate vendor database to improve matching accuracy. Include vendor names, contact info, payment terms, and tax IDs.',
    tags: ['vendors', 'data', 'management']
  },
  {
    id: '5',
    title: 'Integration Setup Guide',
    description: 'Connect FlowBills with your existing systems',
    category: 'Integrations',
    content: 'FlowBills integrates with popular accounting systems, ERPs, and CRMs. Set up OAuth connections or API keys for seamless data flow.',
    tags: ['integration', 'api', 'connection']
  },
  {
    id: '6',
    title: 'Troubleshooting Common Issues',
    description: 'Solutions to frequently encountered problems',
    category: 'Troubleshooting',
    content: 'Having issues? Check your internet connection, verify file formats, ensure you have proper permissions, and review validation rule settings.',
    tags: ['troubleshooting', 'issues', 'support']
  }
];

const videos: VideoTutorial[] = [
  {
    id: '1',
    title: 'FlowBills Platform Overview',
    description: 'Complete walkthrough of all features and capabilities',
    duration: '8:45',
    videoId: 'demo-video-1',
    category: 'Getting Started'
  },
  {
    id: '2',
    title: 'Uploading Your First Invoice',
    description: 'Step-by-step guide to invoice upload and processing',
    duration: '5:30',
    videoId: 'demo-video-2',
    category: 'Getting Started'
  },
  {
    id: '3',
    title: 'Creating Custom Workflows',
    description: 'Build automated approval workflows for your team',
    duration: '10:15',
    videoId: 'demo-video-3',
    category: 'Advanced'
  },
  {
    id: '4',
    title: 'API Integration Tutorial',
    description: 'Connect FlowBills to your existing systems',
    duration: '12:20',
    videoId: 'demo-video-4',
    category: 'Integrations'
  }
];

const guides: Guide[] = [
  {
    id: '1',
    title: 'Complete Onboarding Guide',
    description: 'Get up and running in 10 minutes',
    category: 'Getting Started',
    steps: [
      {
        title: 'Create Your Account',
        content: 'Sign up with your work email and verify your account through the confirmation link sent to your inbox.'
      },
      {
        title: 'Set Up Your Company Profile',
        content: 'Enter your company details including name, address, tax ID, and industry information for compliance purposes.'
      },
      {
        title: 'Configure Validation Rules',
        content: 'Set up custom validation rules for invoice amounts, vendor matching, and approval thresholds based on your needs.'
      },
      {
        title: 'Add Team Members',
        content: 'Invite colleagues and assign roles (admin, operator, viewer) to establish your approval workflow.'
      },
      {
        title: 'Upload Your First Invoice',
        content: 'Try the system by uploading a test invoice and watching it process through validation and approval stages.'
      }
    ]
  },
  {
    id: '2',
    title: 'Setting Up Automated Workflows',
    description: 'Create efficient approval processes',
    category: 'Workflows',
    steps: [
      {
        title: 'Access Workflow Builder',
        content: 'Navigate to the Workflows section from the main dashboard and click "Create New Workflow".'
      },
      {
        title: 'Define Trigger Conditions',
        content: 'Set conditions that trigger the workflow, such as invoice amount, vendor type, or document category.'
      },
      {
        title: 'Add Approval Steps',
        content: 'Create a multi-level approval chain with specific approvers for each step based on invoice criteria.'
      },
      {
        title: 'Configure Notifications',
        content: 'Set up email and in-app notifications to keep team members informed at each stage of approval.'
      },
      {
        title: 'Test and Activate',
        content: 'Run test invoices through your workflow to verify it works as expected, then activate for production use.'
      }
    ]
  },
  {
    id: '3',
    title: 'Integration Setup',
    description: 'Connect with your existing tools',
    category: 'Integrations',
    steps: [
      {
        title: 'Choose Your Integration',
        content: 'Select from supported integrations including QuickBooks, SAP, Sage, and custom API connections.'
      },
      {
        title: 'Authenticate Connection',
        content: 'Complete OAuth authentication or enter API credentials securely to establish the connection.'
      },
      {
        title: 'Map Data Fields',
        content: 'Configure field mapping between FlowBills and your system to ensure data flows correctly.'
      },
      {
        title: 'Set Sync Preferences',
        content: 'Choose sync frequency, data direction (one-way or two-way), and which entities to synchronize.'
      },
      {
        title: 'Monitor Integration Health',
        content: 'Use the integration dashboard to monitor sync status, errors, and data flow metrics.'
      }
    ]
  }
];

const productTours = [
  {
    id: 'invoice-workflow',
    title: 'Invoice Processing Workflow',
    description: 'Complete walkthrough of uploading and processing invoices',
    duration: '2 min',
    category: 'Getting Started'
  },
  {
    id: 'afe-management',
    title: 'AFE Management Tour',
    description: 'Learn to manage Authorization for Expenditure budgets',
    duration: '3 min',
    category: 'Features'
  },
  {
    id: 'field-tickets',
    title: 'Field Tickets Tour',
    description: 'Understand field ticket verification and linking',
    duration: '2 min',
    category: 'Features'
  }
];

const faqItems = [
  {
    question: 'How do I upload multiple invoices at once?',
    answer: 'You can drag and drop multiple files onto the upload widget, or click to select multiple files from your file browser. We support batch uploads of up to 50 invoices at a time.'
  },
  {
    question: 'What file formats are supported?',
    answer: 'FlowBills supports PDF, PNG, JPG, JPEG, and TIFF formats. For best OCR results, we recommend high-resolution PDFs or images with clear, readable text.'
  },
  {
    question: 'How long does invoice processing take?',
    answer: 'Most invoices are processed within 30-60 seconds. Complex multi-page documents or images requiring OCR may take up to 2-3 minutes. You\'ll receive real-time status updates.'
  },
  {
    question: 'Can I customize validation rules?',
    answer: 'Yes! Navigate to Validation Rules from the dashboard to create custom rules based on amount thresholds, vendor matching, PO verification, and more.'
  },
  {
    question: 'How do I integrate with my accounting system?',
    answer: 'Go to Integrations from the main menu, select your accounting system (QuickBooks, SAP, Sage, etc.), and follow the OAuth or API key setup process. We provide step-by-step guidance.'
  },
  {
    question: 'What is three-way matching?',
    answer: 'Three-way matching verifies that the invoice, purchase order, and field ticket all align before approval. This ensures accuracy and prevents duplicate or incorrect payments.'
  },
  {
    question: 'How do I set up approval workflows?',
    answer: 'Access the Workflows section, click "Create New Workflow", and define trigger conditions, approval steps, and notifications. You can create multi-level approval chains based on invoice criteria.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes. FlowBills uses bank-level encryption (TLS 1.3), stores data in Canadian data centers, and complies with PIPEDA privacy regulations. We never share your data with third parties.'
  }
];

export default function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { startTour, hasCompletedTour } = useTour();

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      const matchesSearch = 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const categories = ['all', ...Array.from(new Set(articles.map(a => a.category)))];

  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <BreadcrumbNav className="mb-4" />
      
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Help Center</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Find answers, watch tutorials, and learn how to make the most of FlowBills
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for help articles, guides, and videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Knowledge Base</CardTitle>
            <CardDescription>Browse articles and documentation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{articles.length} articles available</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Video Tutorials</CardTitle>
            <CardDescription>Watch step-by-step guides</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{videos.length} videos available</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Interactive Guides</CardTitle>
            <CardDescription>Follow along with walkthroughs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{guides.length} guides available</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
              <Play className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Product Tours</CardTitle>
            <CardDescription>Interactive step-by-step tours</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{productTours.length} tours available</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="articles" className="space-y-8">
        <TabsList className="grid w-full grid-cols-5 max-w-3xl mx-auto">
          <TabsTrigger value="articles" className="gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Articles</span>
          </TabsTrigger>
          <TabsTrigger value="videos" className="gap-2">
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Videos</span>
          </TabsTrigger>
          <TabsTrigger value="guides" className="gap-2">
            <Lightbulb className="h-4 w-4" />
            <span className="hidden sm:inline">Guides</span>
          </TabsTrigger>
          <TabsTrigger value="tours" className="gap-2">
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">Tours</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="gap-2">
            <span className="hidden sm:inline">FAQ</span>
            <span className="sm:hidden">?</span>
          </TabsTrigger>
        </TabsList>

        {/* Articles Tab */}
        <TabsContent value="articles" className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All Categories' : category}
              </Button>
            ))}
          </div>

          {/* Articles Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map(article => (
              <Card key={article.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary">{article.category}</Badge>
                  </div>
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                  <CardDescription>{article.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {article.content}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {article.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="link" className="p-0 h-auto">
                    Read More <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No articles found matching your search.</p>
            </div>
          )}
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {videos.map(video => (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-all">
                <div className="aspect-video bg-muted flex items-center justify-center relative">
                  <Video className="h-12 w-12 text-muted-foreground" />
                  <div className="absolute bottom-2 right-2 bg-black/75 text-white px-2 py-1 rounded text-xs font-medium">
                    {video.duration}
                  </div>
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary">{video.category}</Badge>
                  </div>
                  <CardTitle className="text-lg">{video.title}</CardTitle>
                  <CardDescription>{video.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">
                    <Video className="h-4 w-4 mr-2" />
                    Watch Video
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Guides Tab */}
        <TabsContent value="guides" className="space-y-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {guides.map(guide => (
              <Card key={guide.id} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary">{guide.category}</Badge>
                  </div>
                  <CardTitle className="text-xl">{guide.title}</CardTitle>
                  <CardDescription>{guide.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {guide.steps.map((step, index) => (
                      <AccordionItem key={index} value={`step-${index}`}>
                        <AccordionTrigger className="text-left">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
                              {index + 1}
                            </div>
                            <span className="font-medium">{step.title}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="ml-11 text-muted-foreground">
                            {step.content}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Product Tours Tab */}
        <TabsContent value="tours" className="space-y-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                Interactive Product Tours
              </h3>
              <p className="text-sm text-muted-foreground">
                Experience guided walkthroughs of FlowBills features. Tours highlight key elements on screen and provide step-by-step instructions. You can pause, skip, or restart tours at any time.
              </p>
            </div>

            <div className="grid gap-4">
              {productTours.map(tour => (
                <Card key={tour.id} className="overflow-hidden hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary">{tour.category}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {tour.duration}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {tour.title}
                      {hasCompletedTour(tour.id) && (
                        <Check className="h-5 w-5 text-green-600" />
                      )}
                    </CardTitle>
                    <CardDescription>{tour.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => startTour(tour.id)}
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {hasCompletedTour(tour.id) ? 'Restart Tour' : 'Start Tour'}
                      </Button>
                      {hasCompletedTour(tour.id) && (
                        <Badge variant="outline" className="self-center text-green-600 border-green-600">
                          Completed
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="mt-6 bg-muted/50">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  <strong>Pro Tip:</strong> You can access product tours anytime from the dashboard by clicking the "Product Tours" button in the header. Your progress is automatically saved.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">
                Quick answers to common questions about FlowBills
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left font-semibold">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <Card className="mt-8 bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Still have questions?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Our support team is available 24/7 to help you with any questions not covered here.
                </p>
                <Button asChild>
                  <a href="/contact">Contact Support</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Contact Support CTA */}
      <Card className="mt-12 bg-primary/5 border-primary/20">
        <CardContent className="pt-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Can't find what you're looking for?</h3>
          <p className="text-muted-foreground mb-4">
            Our 24/7 AI support team is here to help you with any questions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <a href="/contact">
                Contact Support
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/api" target="_blank" rel="noopener noreferrer">
                API Documentation <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
