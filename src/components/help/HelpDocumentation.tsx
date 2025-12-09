import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  Book,
  Video,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  FileText,
  Settings,
  Upload,
  BarChart3,
  Shield,
  Zap,
  Users,
  Lightbulb,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  content: string;
  tags: string[];
  lastUpdated: string;
}

interface HelpCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  articles: HelpArticle[];
}

const HelpDocumentation: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const helpCategories: HelpCategory[] = [
    {
      id: "getting-started",
      name: "Getting Started",
      description: "Learn the basics and set up your account",
      icon: Zap,
      articles: [
        {
          id: "quick-start",
          title: "Quick Start Guide",
          description: "Get up and running in 5 minutes",
          category: "getting-started",
          difficulty: "Beginner",
          content: `# Quick Start Guide

Welcome to the Oil & Gas Billing Platform! This guide will help you get started quickly.

## Step 1: Account Setup
1. Complete the onboarding flow
2. Set up your company profile
3. Configure basic settings

## Step 2: First Invoice
1. Upload your first invoice
2. Review the extracted data
3. Approve or edit as needed

## Step 3: Set Up Workflows
1. Create validation rules
2. Set up approval workflows
3. Configure notifications

## Step 4: Explore Features
- Analytics dashboard
- Compliance monitoring
- Integration options`,
          tags: ["onboarding", "setup", "basics"],
          lastUpdated: "2024-01-15",
        },
        {
          id: "account-setup",
          title: "Account and Profile Setup",
          description: "Configure your account settings and profile",
          category: "getting-started",
          difficulty: "Beginner",
          content: `# Account and Profile Setup

## Personal Profile
- Update your name and contact information
- Set your timezone and language preferences
- Configure notification settings

## Company Profile
- Add company details and logo
- Set up billing information
- Configure user roles and permissions

## Security Settings
- Enable two-factor authentication
- Set up backup email addresses
- Review login history`,
          tags: ["account", "profile", "security"],
          lastUpdated: "2024-01-14",
        },
      ],
    },
    {
      id: "invoice-processing",
      name: "Invoice Processing",
      description: "Learn how to process and manage invoices",
      icon: FileText,
      articles: [
        {
          id: "upload-invoices",
          title: "Uploading and Processing Invoices",
          description: "How to upload and process invoice documents",
          category: "invoice-processing",
          difficulty: "Beginner",
          content: `# Uploading and Processing Invoices

## Supported File Types
- PDF documents
- Image files (PNG, JPG, JPEG)
- Maximum file size: 50MB

## Upload Methods
1. **Drag and Drop**: Simply drag files into the upload area
2. **File Browser**: Click to select files from your computer
3. **Email Integration**: Forward invoices to your unique email address
4. **API Upload**: Use our REST API for automated uploads

## Processing Steps
1. **Upload**: Files are uploaded to secure storage
2. **OCR**: Text and data are extracted using AI
3. **Validation**: Data is checked against your rules
4. **Review**: Manual review if needed
5. **Approval**: Final approval and processing`,
          tags: ["upload", "processing", "ocr"],
          lastUpdated: "2024-01-16",
        },
        {
          id: "validation-rules",
          title: "Setting Up Validation Rules",
          description: "Create rules to automatically validate invoice data",
          category: "invoice-processing",
          difficulty: "Intermediate",
          content: `# Setting Up Validation Rules

## Types of Validation Rules
- **Amount Limits**: Set minimum and maximum amounts
- **Vendor Validation**: Verify approved vendor lists
- **Date Ranges**: Check invoice and due dates
- **Tax Calculations**: Validate tax amounts
- **Custom Fields**: Validate custom data fields

## Creating Rules
1. Go to Settings > Validation Rules
2. Click "Create New Rule"
3. Choose rule type and conditions
4. Set actions (approve, flag, reject)
5. Test and activate the rule

## Best Practices
- Start with basic amount and vendor rules
- Test rules with sample data first
- Monitor rule performance regularly
- Update rules as business needs change`,
          tags: ["validation", "rules", "automation"],
          lastUpdated: "2024-01-13",
        },
      ],
    },
    {
      id: "compliance",
      name: "Compliance & Security",
      description: "Understand compliance requirements and security features",
      icon: Shield,
      articles: [
        {
          id: "regulatory-compliance",
          title: "Regulatory Compliance Overview",
          description: "Understanding compliance requirements for oil & gas",
          category: "compliance",
          difficulty: "Intermediate",
          content: `# Regulatory Compliance Overview

## Key Regulations
- **SOX Compliance**: Sarbanes-Oxley financial reporting
- **SEC Regulations**: Securities and Exchange Commission
- **IRS Requirements**: Tax documentation and reporting
- **State Regulations**: Local oil & gas regulations

## Compliance Features
- Audit trails for all transactions
- Digital signatures and approvals
- Retention policies for documents
- Compliance reporting tools

## Best Practices
- Regular compliance audits
- Staff training on regulations
- Document retention policies
- Regular system updates`,
          tags: ["compliance", "regulations", "audit"],
          lastUpdated: "2024-01-12",
        },
      ],
    },
    {
      id: "analytics",
      name: "Analytics & Reporting",
      description: "Generate insights and reports from your data",
      icon: BarChart3,
      articles: [
        {
          id: "dashboard-overview",
          title: "Analytics Dashboard Overview",
          description: "Understanding your analytics dashboard",
          category: "analytics",
          difficulty: "Beginner",
          content: `# Analytics Dashboard Overview

## Key Metrics
- **Total Invoices**: Number of processed invoices
- **Total Amount**: Sum of all invoice amounts
- **Average Processing Time**: Time from upload to approval
- **Compliance Score**: Percentage of compliant invoices

## Chart Types
- Line charts for trends over time
- Bar charts for comparisons
- Pie charts for category breakdowns
- Heatmaps for activity patterns

## Filtering Options
- Date ranges
- Vendor categories
- Invoice amounts
- Processing status
- Compliance status`,
          tags: ["dashboard", "metrics", "analytics"],
          lastUpdated: "2024-01-11",
        },
      ],
    },
    {
      id: "integrations",
      name: "Integrations",
      description: "Connect with your existing systems",
      icon: Settings,
      articles: [
        {
          id: "api-documentation",
          title: "API Documentation",
          description: "Complete guide to our REST API",
          category: "integrations",
          difficulty: "Advanced",
          content: `# API Documentation

## Authentication
All API requests require authentication using API keys:
\`\`\`
Authorization: Bearer YOUR_API_KEY
\`\`\`

## Endpoints

### Upload Invoice
\`\`\`
POST /api/invoices/upload
Content-Type: multipart/form-data

{
  "file": [binary file data],
  "metadata": {
    "vendor": "string",
    "amount": "number"
  }
}
\`\`\`

### Get Invoice Status
\`\`\`
GET /api/invoices/{id}/status

Response:
{
  "id": "invoice_123",
  "status": "processed",
  "amount": 1000.00,
  "vendor": "ACME Corp"
}
\`\`\`

## Rate Limits
- 1000 requests per hour
- 10 MB max file size
- JSON responses only`,
          tags: ["api", "integration", "development"],
          lastUpdated: "2024-01-10",
        },
      ],
    },
    {
      id: "troubleshooting",
      name: "Troubleshooting",
      description: "Common issues and solutions",
      icon: AlertCircle,
      articles: [
        {
          id: "common-issues",
          title: "Common Issues and Solutions",
          description: "Quick fixes for frequently encountered problems",
          category: "troubleshooting",
          difficulty: "Beginner",
          content: `# Common Issues and Solutions

## Upload Issues

### "File too large" error
- **Problem**: File exceeds 50MB limit
- **Solution**: Compress the file or split into multiple documents

### "Unsupported file type" error
- **Problem**: File format not supported
- **Solution**: Convert to PDF, PNG, or JPG format

## Processing Issues

### Poor OCR results
- **Problem**: Text extraction is inaccurate
- **Solutions**:
  - Ensure document quality is good
  - Avoid scanned documents when possible
  - Use PDF files instead of images

### Validation failures
- **Problem**: Invoices failing validation rules
- **Solutions**:
  - Review validation rule settings
  - Check for data entry errors
  - Update vendor information

## Performance Issues

### Slow loading
- **Solutions**:
  - Clear browser cache
  - Check internet connection
  - Try different browser

### Timeout errors
- **Solutions**:
  - Reduce file sizes
  - Upload fewer files at once
  - Contact support if persistent`,
          tags: ["troubleshooting", "errors", "performance"],
          lastUpdated: "2024-01-09",
        },
      ],
    },
  ];

  const allArticles = helpCategories.flatMap((cat) => cat.articles);

  const filteredArticles = allArticles.filter((article) => {
    const matchesSearch =
      searchQuery === "" ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = !selectedCategory || article.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Book className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Help & Documentation</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Find answers, learn new features, and get the most out of your Oil & Gas Billing Platform
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse">Browse Topics</TabsTrigger>
          <TabsTrigger value="search">Search Results</TabsTrigger>
          <TabsTrigger value="video">Video Tutorials</TabsTrigger>
          <TabsTrigger value="support">Get Support</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <category.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {category.articles.slice(0, 3).map((article) => (
                      <div
                        key={article.id}
                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded"
                      >
                        <span className="text-sm">{article.title}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                    {category.articles.length > 3 && (
                      <div className="text-sm text-muted-foreground text-center pt-2">
                        +{category.articles.length - 3} more articles
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {searchQuery ? `Search results for "${searchQuery}"` : "All Articles"}
              </h3>
              <span className="text-sm text-muted-foreground">
                {filteredArticles.length} articles found
              </span>
            </div>

            <div className="grid gap-4">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-lg font-medium">{article.title}</h4>
                          <Badge
                            variant="outline"
                            className={getDifficultyColor(article.difficulty)}
                          >
                            {article.difficulty}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mb-3">{article.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Updated: {article.lastUpdated}</span>
                          <div className="flex space-x-1">
                            {article.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="video" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Getting Started Tutorial",
                description: "Complete walkthrough of setting up your account",
                duration: "12:34",
                thumbnail: "/api/placeholder/400/225",
              },
              {
                title: "Invoice Processing Workflow",
                description: "Learn how to process invoices efficiently",
                duration: "8:45",
                thumbnail: "/api/placeholder/400/225",
              },
              {
                title: "Advanced Analytics",
                description: "Deep dive into analytics and reporting features",
                duration: "15:20",
                thumbnail: "/api/placeholder/400/225",
              },
            ].map((video, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                  <Video className="h-12 w-12 text-muted-foreground" />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{video.title}</h4>
                    <span className="text-xs bg-black text-white px-2 py-1 rounded">
                      {video.duration}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{video.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="support" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Contact Support</span>
                </CardTitle>
                <CardDescription>Get help from our support team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Email Support</span>
                    <Badge variant="outline">24/7</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">support@oilgasbilling.com</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Live Chat</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Available 9 AM - 5 PM EST</p>
                </div>
                <Button className="w-full">Start Live Chat</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Community Forum</span>
                </CardTitle>
                <CardDescription>Connect with other users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm">Join our community to:</p>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                    <li>• Ask questions and get answers</li>
                    <li>• Share tips and best practices</li>
                    <li>• Stay updated on new features</li>
                    <li>• Connect with industry peers</li>
                  </ul>
                </div>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Visit Forum
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>Feature Requests</span>
              </CardTitle>
              <CardDescription>Suggest new features or improvements</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Have an idea for a new feature? We'd love to hear from you!
              </p>
              <Button variant="outline">Submit Feature Request</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Access FAQ */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
          <CardDescription>Quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I upload my first invoice?</AccordionTrigger>
              <AccordionContent>
                You can upload invoices by dragging and dropping files into the upload area, using
                the file browser, or sending them to your unique email address. Supported formats
                include PDF, PNG, and JPG files up to 50MB.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>What file formats are supported?</AccordionTrigger>
              <AccordionContent>
                We support PDF documents and image files (PNG, JPG, JPEG) up to 50MB in size. PDF
                files generally provide the best OCR results for text extraction.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How accurate is the data extraction?</AccordionTrigger>
              <AccordionContent>
                Our AI-powered OCR achieves over 95% accuracy on clear, digital documents. Accuracy
                may vary with scanned documents or poor image quality. You can always review and
                edit extracted data before final approval.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>
                Can I integrate with my existing accounting system?
              </AccordionTrigger>
              <AccordionContent>
                Yes! We offer REST API integration and pre-built connectors for popular accounting
                systems like QuickBooks, SAP, and Oracle. Check our integrations documentation for
                detailed setup instructions.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpDocumentation;
