import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  Upload,
  Database,
  Settings,
  CheckCircle,
  AlertTriangle,
  Code,
  FileSpreadsheet,
  Globe,
  Shield,
  Users,
  Workflow,
} from "lucide-react";

const ClientIntegration = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Flow Bills Platform Integration Guide</h1>
          <p className="text-xl text-muted-foreground">
            Complete instructions for integrating Flow Bills into your oil & gas operations
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="data">Data Import</TabsTrigger>
            <TabsTrigger value="api">API Access</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="golive">Go Live</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Integration Overview
                </CardTitle>
                <CardDescription>
                  Flow Bills provides multiple integration methods to fit your business needs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        File Upload
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Manual file uploads via web interface
                      </p>
                      <Badge variant="secondary">Easiest</Badge>
                      <ul className="text-sm space-y-1 mt-2">
                        <li>• PDF, Excel, CSV support</li>
                        <li>• Drag & drop interface</li>
                        <li>• Real-time validation</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        API Integration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Automated data exchange via REST API
                      </p>
                      <Badge variant="default">Recommended</Badge>
                      <ul className="text-sm space-y-1 mt-2">
                        <li>• Real-time sync</li>
                        <li>• Bulk operations</li>
                        <li>• Webhook notifications</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Direct Database
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Enterprise database connections
                      </p>
                      <Badge variant="outline">Enterprise</Badge>
                      <ul className="text-sm space-y-1 mt-2">
                        <li>• ODBC/JDBC support</li>
                        <li>• Scheduled sync</li>
                        <li>• Custom mappings</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security & Compliance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Security Features</h4>
                    <ul className="text-sm space-y-1">
                      <li>• End-to-end encryption (TLS 1.3)</li>
                      <li>• Role-based access control</li>
                      <li>• API key authentication</li>
                      <li>• Audit logging & monitoring</li>
                      <li>• Data anonymization options</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Compliance Standards</h4>
                    <ul className="text-sm space-y-1">
                      <li>• SOC 2 Type II certified</li>
                      <li>• PIPEDA/GDPR compliant</li>
                      <li>• Oil & gas regulatory standards</li>
                      <li>• Financial data protection</li>
                      <li>• Regular security audits</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Initial Setup Process
                </CardTitle>
                <CardDescription>
                  Follow these steps to get your Flow Bills integration ready
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Account Provisioning</h4>
                      <p className="text-sm text-muted-foreground">
                        Flow Bills team creates your organization account
                      </p>
                      <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
                        <li>• Custom subdomain setup (yourcompany.flowbills.ca)</li>
                        <li>• Initial admin user creation</li>
                        <li>• Environment configuration</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">User Management Setup</h4>
                      <p className="text-sm text-muted-foreground">
                        Configure your team access and roles
                      </p>
                      <div className="mt-2 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-2">Available Roles:</p>
                        <ul className="text-sm space-y-1">
                          <li>
                            •{" "}
                            <Badge variant="secondary" className="mr-2">
                              Admin
                            </Badge>
                            Full platform access, user management
                          </li>
                          <li>
                            •{" "}
                            <Badge variant="outline" className="mr-2">
                              Operator
                            </Badge>
                            Invoice processing, workflow management
                          </li>
                          <li>
                            •{" "}
                            <Badge variant="outline" className="mr-2">
                              Viewer
                            </Badge>
                            Read-only access to reports and data
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">System Integration Planning</h4>
                      <p className="text-sm text-muted-foreground">
                        Map your existing systems to Flow Bills
                      </p>
                      <Alert className="mt-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Pre-requisites:</strong> Inventory your current invoice management
                          systems, data formats, and integration points before proceeding.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                      4
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Security Configuration</h4>
                      <p className="text-sm text-muted-foreground">
                        Set up secure access credentials
                      </p>
                      <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
                        <li>• API key generation</li>
                        <li>• IP whitelisting (if required)</li>
                        <li>• SSL certificate validation</li>
                        <li>• Two-factor authentication setup</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Network Requirements</h4>
                    <ul className="text-sm space-y-2">
                      <li>• HTTPS outbound connectivity (port 443)</li>
                      <li>• DNS resolution for *.flowbills.ca</li>
                      <li>• Minimum 10 Mbps bandwidth</li>
                      <li>• Firewall rules for API endpoints</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Data Format Support</h4>
                    <ul className="text-sm space-y-2">
                      <li>
                        • <FileSpreadsheet className="inline h-4 w-4 mr-1" />
                        PDF invoices with OCR
                      </li>
                      <li>
                        • <FileSpreadsheet className="inline h-4 w-4 mr-1" />
                        Excel files (.xlsx, .xls)
                      </li>
                      <li>
                        • <FileSpreadsheet className="inline h-4 w-4 mr-1" />
                        CSV with custom delimiters
                      </li>
                      <li>
                        • <FileSpreadsheet className="inline h-4 w-4 mr-1" />
                        XML/JSON via API
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Data Import Methods
                </CardTitle>
                <CardDescription>
                  Choose the best method for importing your existing invoice data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Tabs defaultValue="bulk-upload">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
                    <TabsTrigger value="api-import">API Import</TabsTrigger>
                    <TabsTrigger value="scheduled">Scheduled Sync</TabsTrigger>
                  </TabsList>

                  <TabsContent value="bulk-upload" className="mt-4">
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Recommended for:</strong> Initial data migration, one-time
                          imports, small to medium datasets (&lt;10,000 records)
                        </AlertDescription>
                      </Alert>

                      <div className="grid md:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">Excel Template</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                              Use our standardized Excel template for consistent data import
                            </p>
                            <Button variant="outline" className="w-full">
                              <Download className="h-4 w-4 mr-2" />
                              Download Template
                            </Button>
                            <div className="mt-3 text-xs text-muted-foreground">
                              <p>
                                <strong>Required fields:</strong> Invoice Number, Vendor, Amount,
                                Date
                              </p>
                              <p>
                                <strong>Optional fields:</strong> PO Number, Description, GL Codes
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-lg">CSV Format</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                              Export from your existing system in CSV format
                            </p>
                            <div className="bg-muted p-3 rounded text-xs font-mono">
                              invoice_num,vendor_name,amount,date,status
                              <br />
                              INV-001,"ABC Oil Services",1250.00,"2024-01-15","pending"
                              <br />
                              INV-002,"XYZ Equipment",875.50,"2024-01-16","approved"
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              Supports UTF-8 encoding, comma/semicolon delimiters
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Upload Process</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                1
                              </div>
                              <span>Prepare your data using the template or CSV format</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                2
                              </div>
                              <span>Navigate to Invoices → Import → Bulk Upload</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                3
                              </div>
                              <span>Drag and drop your file or click to browse</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                4
                              </div>
                              <span>Review validation results and fix any errors</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                5
                              </div>
                              <span>Confirm import and monitor processing status</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="api-import" className="mt-4">
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Recommended for:</strong> Large datasets, real-time integration,
                          automated processes
                        </AlertDescription>
                      </Alert>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">API Endpoints</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="bg-muted p-4 rounded-lg">
                            <h4 className="font-semibold mb-2">Base URL</h4>
                            <code className="text-sm">https://api.flowbills.ca/v1</code>
                          </div>

                          <div className="space-y-3">
                            <div className="border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="default">POST</Badge>
                                <code className="text-sm">/invoices/bulk</code>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Bulk import invoices (up to 1000 per request)
                              </p>
                            </div>

                            <div className="border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="default">POST</Badge>
                                <code className="text-sm">/invoices</code>
                              </div>
                              <p className="text-sm text-muted-foreground">Create single invoice</p>
                            </div>

                            <div className="border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">PUT</Badge>
                                <code className="text-sm">/invoices/{"{id}"}</code>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Update existing invoice
                              </p>
                            </div>

                            <div className="border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">GET</Badge>
                                <code className="text-sm">/invoices/import-status/{"{id}"}</code>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Check import job status
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Sample API Call</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
                            <pre>{`curl -X POST https://api.flowbills.ca/v1/invoices/bulk \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "invoices": [
      {
        "invoice_number": "INV-001",
        "vendor_name": "ABC Oil Services",
        "amount": 1250.00,
        "invoice_date": "2024-01-15",
        "due_date": "2024-02-15",
        "status": "pending"
      }
    ]
  }'`}</pre>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="scheduled" className="mt-4">
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Recommended for:</strong> Ongoing synchronization, ERP
                          integration, automated workflows
                        </AlertDescription>
                      </Alert>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Sync Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">Frequency Options</h4>
                              <ul className="text-sm space-y-1">
                                <li>• Real-time (webhook-based)</li>
                                <li>• Every 15 minutes</li>
                                <li>• Hourly</li>
                                <li>• Daily at specific time</li>
                                <li>• Weekly/Monthly</li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Data Sources</h4>
                              <ul className="text-sm space-y-1">
                                <li>• SQL Server databases</li>
                                <li>• Oracle databases</li>
                                <li>• PostgreSQL</li>
                                <li>• FTP/SFTP file drops</li>
                                <li>• REST API endpoints</li>
                              </ul>
                            </div>
                          </div>

                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              <strong>Enterprise Feature:</strong> Scheduled sync requires
                              Enterprise plan and involves custom configuration by our integration
                              team.
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API Integration Guide
                </CardTitle>
                <CardDescription>Complete API documentation and code examples</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Authentication</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <h4 className="font-semibold mb-2">API Key Authentication</h4>
                        <div className="bg-muted p-3 rounded text-sm font-mono">
                          Authorization: Bearer YOUR_API_KEY
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Generate API Key</h4>
                        <ol className="text-sm space-y-1">
                          <li>1. Log into Flow Bills platform</li>
                          <li>2. Go to Settings → API Access</li>
                          <li>3. Click "Generate New Key"</li>
                          <li>4. Copy and securely store the key</li>
                        </ol>
                      </div>
                      <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          API keys provide full access to your account. Store them securely and
                          rotate regularly.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Rate Limits</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Standard Plan:</span>
                          <Badge variant="outline">1000 req/hour</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Professional Plan:</span>
                          <Badge variant="outline">5000 req/hour</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Enterprise Plan:</span>
                          <Badge variant="outline">25000 req/hour</Badge>
                        </div>
                      </div>
                      <div className="border-t pt-3">
                        <h4 className="font-semibold mb-2 text-sm">Rate Limit Headers</h4>
                        <div className="text-xs font-mono space-y-1">
                          <div>X-RateLimit-Limit: 1000</div>
                          <div>X-RateLimit-Remaining: 999</div>
                          <div>X-RateLimit-Reset: 1642694400</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Common API Operations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="create-invoice">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="create-invoice">Create Invoice</TabsTrigger>
                        <TabsTrigger value="update-invoice">Update Invoice</TabsTrigger>
                        <TabsTrigger value="list-invoices">List Invoices</TabsTrigger>
                        <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
                      </TabsList>

                      <TabsContent value="create-invoice" className="mt-4">
                        <div className="space-y-4">
                          <div className="bg-muted p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="default">POST</Badge>
                              <code className="text-sm">/api/v1/invoices</code>
                            </div>
                          </div>
                          <div className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
                            <pre>{`{
  "invoice_number": "INV-2024-001",
  "vendor_name": "Oilfield Services Inc.",
  "amount": 15750.00,
  "invoice_date": "2024-01-15",
  "due_date": "2024-02-15",
  "description": "Equipment rental and maintenance",
  "po_number": "PO-2024-100",
  "gl_codes": ["5100", "5200"],
  "status": "pending",
  "metadata": {
    "well_id": "WELL-001",
    "cost_center": "DRILLING"
  }
}`}</pre>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="update-invoice" className="mt-4">
                        <div className="space-y-4">
                          <div className="bg-muted p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">PUT</Badge>
                              <code className="text-sm">/api/v1/invoices/{`{id}`}</code>
                            </div>
                          </div>
                          <div className="bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto">
                            <pre>{`{
  "status": "approved",
  "approval_date": "2024-01-20",
  "approved_by": "john.smith@company.com",
  "notes": "Approved for payment - verified with operations team"
}`}</pre>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="list-invoices" className="mt-4">
                        <div className="space-y-4">
                          <div className="bg-muted p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">GET</Badge>
                              <code className="text-sm">
                                /api/v1/invoices?status=pending&limit=50
                              </code>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Query Parameters</h4>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <strong>Filtering:</strong>
                                <ul className="mt-1 space-y-1">
                                  <li>• status: pending, approved, paid</li>
                                  <li>• vendor: vendor name or ID</li>
                                  <li>• date_from / date_to: date range</li>
                                  <li>• amount_min / amount_max: amount range</li>
                                </ul>
                              </div>
                              <div>
                                <strong>Pagination:</strong>
                                <ul className="mt-1 space-y-1">
                                  <li>• limit: max 100 (default 25)</li>
                                  <li>• offset: for pagination</li>
                                  <li>• sort: field to sort by</li>
                                  <li>• order: asc or desc</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="webhooks" className="mt-4">
                        <div className="space-y-4">
                          <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Webhooks allow real-time notifications when invoice status changes or
                              new invoices are processed.
                            </AlertDescription>
                          </Alert>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2">Supported Events</h4>
                              <ul className="text-sm space-y-1">
                                <li>
                                  • <code>invoice.created</code>
                                </li>
                                <li>
                                  • <code>invoice.updated</code>
                                </li>
                                <li>
                                  • <code>invoice.approved</code>
                                </li>
                                <li>
                                  • <code>invoice.paid</code>
                                </li>
                                <li>
                                  • <code>invoice.rejected</code>
                                </li>
                              </ul>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Webhook Setup</h4>
                              <ol className="text-sm space-y-1">
                                <li>1. Create endpoint in your system</li>
                                <li>2. Add webhook URL in Flow Bills</li>
                                <li>3. Select events to subscribe to</li>
                                <li>4. Verify webhook signature</li>
                              </ol>
                            </div>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Testing & Validation
                </CardTitle>
                <CardDescription>
                  Comprehensive testing procedures before going live
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> All testing should be performed in the sandbox
                    environment. Contact support to request sandbox access.
                  </AlertDescription>
                </Alert>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Sandbox Environment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="text-sm">
                          <strong>URL:</strong> <code>https://sandbox.flowbills.ca</code>
                        </div>
                        <div className="text-sm">
                          <strong>API:</strong> <code>https://api-sandbox.flowbills.ca/v1</code>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Test Credentials</h4>
                        <div className="bg-muted p-3 rounded text-sm">
                          <div>Email: test@yourcompany.com</div>
                          <div>Password: TestPassword123!</div>
                          <div>API Key: sk_test_...</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Test Data Sets</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Pre-loaded test data for various scenarios
                      </p>
                      <ul className="text-sm space-y-1">
                        <li>• Sample oil & gas vendors</li>
                        <li>• Various invoice formats</li>
                        <li>• Complex approval workflows</li>
                        <li>• Integration test scenarios</li>
                        <li>• Error condition testing</li>
                      </ul>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download Test Dataset
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Testing Checklist</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Functional Testing</h4>
                        <div className="space-y-2">
                          {[
                            "User authentication and roles",
                            "Invoice upload (PDF, Excel, CSV)",
                            "Data validation and error handling",
                            "Approval workflow processes",
                            "Search and filtering functions",
                            "Report generation",
                            "Export functionality",
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <input type="checkbox" className="rounded" />
                              <label>{item}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Integration Testing</h4>
                        <div className="space-y-2">
                          {[
                            "API authentication",
                            "Bulk data import via API",
                            "Real-time data sync",
                            "Webhook notifications",
                            "Error handling and retries",
                            "Rate limit behavior",
                            "Data integrity validation",
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <input type="checkbox" className="rounded" />
                              <label>{item}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Performance Testing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Load Testing</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Concurrent user limits</li>
                          <li>• Large file uploads</li>
                          <li>• Bulk API operations</li>
                          <li>• Peak usage scenarios</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Expected Metrics</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Page load: &lt;3 seconds</li>
                          <li>• API response: &lt;500ms</li>
                          <li>• File upload: 10MB/min</li>
                          <li>• Concurrent users: 100+</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Monitoring</h4>
                        <ul className="text-sm space-y-1">
                          <li>• Response times</li>
                          <li>• Error rates</li>
                          <li>• Resource usage</li>
                          <li>• User experience</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="golive" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Go-Live Process
                </CardTitle>
                <CardDescription>
                  Step-by-step guide to launch your Flow Bills integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pre-requisite:</strong> Complete all testing phases and receive sign-off
                    from your project team before proceeding with go-live.
                  </AlertDescription>
                </Alert>

                <div className="space-y-6">
                  <div className="border-l-4 border-primary pl-4">
                    <h3 className="font-semibold text-lg mb-2">Phase 1: Pre-Production Setup</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                          1
                        </div>
                        <div>
                          <h4 className="font-semibold">Production Environment Preparation</h4>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                            <li>• Production tenant provisioning</li>
                            <li>• SSL certificate installation</li>
                            <li>• Custom domain configuration</li>
                            <li>• Production API keys generation</li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                          2
                        </div>
                        <div>
                          <h4 className="font-semibold">Data Migration</h4>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                            <li>• Historical invoice data import</li>
                            <li>• Vendor master data setup</li>
                            <li>• User account creation</li>
                            <li>• Configuration settings transfer</li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                          3
                        </div>
                        <div>
                          <h4 className="font-semibold">Security Validation</h4>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                            <li>• Security scan and penetration testing</li>
                            <li>• Access control verification</li>
                            <li>• Data encryption validation</li>
                            <li>• Compliance audit</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-secondary pl-4">
                    <h3 className="font-semibold text-lg mb-2">Phase 2: Soft Launch</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-secondary text-secondary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                          1
                        </div>
                        <div>
                          <h4 className="font-semibold">Limited User Rollout</h4>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                            <li>• Start with 5-10 power users</li>
                            <li>• Process limited invoice volume</li>
                            <li>• Monitor system performance</li>
                            <li>• Gather user feedback</li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-secondary text-secondary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                          2
                        </div>
                        <div>
                          <h4 className="font-semibold">Monitoring & Support</h4>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                            <li>• 24/7 monitoring during soft launch</li>
                            <li>• Dedicated support channel</li>
                            <li>• Daily performance reports</li>
                            <li>• Issue escalation procedures</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <h3 className="font-semibold text-lg mb-2">Phase 3: Full Production</h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                          1
                        </div>
                        <div>
                          <h4 className="font-semibold">Complete User Rollout</h4>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                            <li>• All users granted access</li>
                            <li>• Full integration activation</li>
                            <li>• Legacy system retirement</li>
                            <li>• Change management communication</li>
                          </ul>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">
                          2
                        </div>
                        <div>
                          <h4 className="font-semibold">Ongoing Operations</h4>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                            <li>• Standard support procedures</li>
                            <li>• Regular health checks</li>
                            <li>• Performance optimization</li>
                            <li>• Continuous improvement</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Success Criteria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Technical Metrics</h4>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>99.9% system uptime</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>&lt;3 second page load times</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Zero data loss incidents</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Successful integration sync</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Business Metrics</h4>
                        <ul className="text-sm space-y-2">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>100% invoice processing accuracy</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>50% reduction in processing time</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>User adoption &gt;90%</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Compliance audit passing</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Support & Maintenance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Support Channels</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <strong>Email:</strong> support@flowbills.ca
                          </div>
                          <div>
                            <strong>Phone:</strong> 1-800-FLOWBILL
                          </div>
                          <div>
                            <strong>Portal:</strong> https://support.flowbills.ca
                          </div>
                          <div>
                            <strong>Emergency:</strong> 24/7 escalation available
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-3">Response Times</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Critical (System Down):</span>
                            <Badge variant="destructive">1 hour</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>High Priority:</span>
                            <Badge variant="secondary">4 hours</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Medium Priority:</span>
                            <Badge variant="outline">1 business day</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Low Priority:</span>
                            <Badge variant="outline">3 business days</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ClientIntegration;
