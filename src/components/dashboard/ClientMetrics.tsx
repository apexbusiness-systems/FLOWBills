import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Users, 
  MapPin,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  Award,
  Zap,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const ClientMetrics = () => {
  const clientStats = [
    { metric: "Total Active Clients", value: "247", change: "+18 this quarter", icon: Building2 },
    { metric: "Monthly Recurring Revenue", value: "$1.2M", change: "+24.5% YoY", icon: DollarSign },
    { metric: "Enterprise Clients", value: "89", change: "+12 this year", icon: Award },
    { metric: "Client Satisfaction", value: "98.2%", change: "+3.1% vs last year", icon: Target }
  ];

  const topClients = [
    { 
      name: "Suncor Energy", 
      industry: "Oil Sands", 
      location: "Alberta", 
      revenue: "$89K/mo",
      invoices: "2,847/mo",
      satisfaction: 99.1,
      tier: "Enterprise"
    },
    { 
      name: "Canadian Natural Resources", 
      industry: "Integrated Oil & Gas", 
      location: "Calgary, AB", 
      revenue: "$67K/mo",
      invoices: "1,923/mo",
      satisfaction: 98.7,
      tier: "Enterprise"
    },
    { 
      name: "Cenovus Energy", 
      industry: "Oil Sands", 
      location: "Alberta", 
      revenue: "$54K/mo",
      invoices: "1,456/mo",
      satisfaction: 97.9,
      tier: "Enterprise"
    },
    { 
      name: "Imperial Oil", 
      industry: "Refining", 
      location: "Ontario", 
      revenue: "$43K/mo",
      invoices: "987/mo",
      satisfaction: 98.5,
      tier: "Premium"
    },
    { 
      name: "Husky Energy", 
      industry: "Integrated", 
      location: "Calgary, AB", 
      revenue: "$38K/mo",
      invoices: "834/mo",
      satisfaction: 97.2,
      tier: "Premium"
    }
  ];

  const industryBreakdown = [
    { segment: "Oil Sands Operations", clients: 89, percentage: 36, revenue: "$432K" },
    { segment: "Conventional Oil & Gas", clients: 67, percentage: 27, revenue: "$318K" },
    { segment: "Pipeline & Midstream", clients: 45, percentage: 18, revenue: "$234K" },
    { segment: "Refining & Petrochemicals", clients: 28, percentage: 11, revenue: "$156K" },
    { segment: "Service Companies", clients: 18, percentage: 8, revenue: "$89K" }
  ];

  const regionalStats = [
    { region: "Alberta", clients: 142, percentage: 57.5 },
    { region: "Saskatchewan", clients: 38, percentage: 15.4 },
    { region: "British Columbia", clients: 34, percentage: 13.8 },
    { region: "Ontario", clients: 21, percentage: 8.5 },
    { region: "Other Provinces", clients: 12, percentage: 4.8 }
  ];

  return (
    <div className="space-y-8">
      {/* Client Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {clientStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">{stat.metric}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change}</p>
                </div>
                <stat.icon className="h-12 w-12 text-primary opacity-60" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Clients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Top Enterprise Clients
          </CardTitle>
          <CardDescription>
            Our highest-value clients by monthly processing volume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topClients.map((client, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">{client.name}</div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{client.industry}</span>
                      <span>•</span>
                      <MapPin className="h-3 w-3" />
                      <span>{client.location}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={client.tier === 'Enterprise' ? 'default' : 'secondary'}>
                      {client.tier}
                    </Badge>
                    <span className="font-semibold text-primary">{client.revenue}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {client.invoices} • {client.satisfaction}% satisfaction
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Industry Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Industry Segments
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {industryBreakdown.map((segment, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{segment.segment}</span>
                  <div className="text-right">
                    <div className="font-semibold text-primary">{segment.revenue}</div>
                    <div className="text-sm text-muted-foreground">{segment.clients} clients</div>
                  </div>
                </div>
                <Progress value={segment.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Regional Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Regional Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {regionalStats.map((region, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{region.region}</span>
                  <div className="text-right">
                    <div className="font-semibold">{region.clients} clients</div>
                    <div className="text-sm text-muted-foreground">{region.percentage}%</div>
                  </div>
                </div>
                <Progress value={region.percentage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Client Success Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">98.7%</div>
              <div className="text-sm text-muted-foreground">Client Retention Rate</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">47 hrs</div>
              <div className="text-sm text-muted-foreground">Avg. Processing Time Saved</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">34%</div>
              <div className="text-sm text-muted-foreground">Cost Reduction Achieved</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/30">
              <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">99.1%</div>
              <div className="text-sm text-muted-foreground">SLA Compliance Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientMetrics;