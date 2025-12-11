import { useState, useEffect } from "react";
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SmartSuggestion {
  id: string;
  type: 'optimization' | 'warning' | 'tip' | 'automation';
  title: string;
  description: string;
  action?: string;
  priority: 'low' | 'medium' | 'high';
  category: 'workflow' | 'compliance' | 'efficiency' | 'security';
}

interface SmartSuggestionsProps {
  onApplySuggestion?: (suggestion: SmartSuggestion) => void;
  onDismiss?: (suggestionId: string) => void;
}

const SmartSuggestions = ({ onApplySuggestion, onDismiss }: SmartSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Generate smart suggestions based on current system state
    const generateSuggestions = () => {
      const newSuggestions: SmartSuggestion[] = [
        {
          id: '1',
          type: 'optimization',
          title: 'Automate JIB Allocation Rules',
          description: 'Based on your invoice patterns, you can create automatic allocation rules for 78% of your JIB transactions.',
          action: 'Create allocation rules for wells with consistent working interest patterns',
          priority: 'high',
          category: 'efficiency'
        },
        {
          id: '2',
          type: 'warning',
          title: 'Monthly Compliance Review Due',
          description: 'CER billing compliance review is due in 5 days. 12 invoices need regulatory classification.',
          action: 'Review invoices in exceptions queue with missing regulatory codes',
          priority: 'high',
          category: 'compliance'
        },
        {
          id: '3',
          type: 'tip',
          title: 'Optimize Vendor Master Data',
          description: 'Standardizing vendor naming conventions could reduce matching errors by 23%.',
          action: 'Run vendor consolidation wizard to merge duplicate entries',
          priority: 'medium',
          category: 'workflow'
        },
        {
          id: '4',
          type: 'automation',
          title: 'Enable Smart Invoice Routing',
          description: 'AI can automatically route 89% of routine invoices to appropriate approvers based on cost center and amount.',
          action: 'Configure approval routing rules based on your organization structure',
          priority: 'medium',
          category: 'efficiency'
        },
        {
          id: '5',
          type: 'warning',
          title: 'NOV Integration Health Check',
          description: 'AccessNOV connection has been slower than usual. Last sync took 45% longer than average.',
          action: 'Run diagnostic check on NOV SFTP connection and file processing',  
          priority: 'medium',
          category: 'security'
        }
      ];

      setSuggestions(newSuggestions);
      setIsVisible(true);
    };

    // Generate suggestions after component mounts
    const timer = setTimeout(generateSuggestions, 2000);
    return () => clearTimeout(timer);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'optimization':
        return <TrendingUp className="h-4 w-4 text-status-approved" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-status-rejected" />;
      case 'tip':
        return <Lightbulb className="h-4 w-4 text-status-pending" />;
      case 'automation':
        return <CheckCircle className="h-4 w-4 text-status-processing" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="rejected">High Priority</Badge>;
      case 'medium':
        return <Badge variant="pending">Medium</Badge>;
      case 'low':
        return <Badge variant="approved">Low</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'workflow':
        return 'border-l-status-processing';
      case 'compliance':
        return 'border-l-status-rejected';
      case 'efficiency':
        return 'border-l-status-approved';
      case 'security':
        return 'border-l-status-pending';
      default:
        return 'border-l-muted';
    }
  };

  const handleApply = (suggestion: SmartSuggestion) => {
    onApplySuggestion?.(suggestion);
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const handleDismiss = (suggestionId: string) => {
    onDismiss?.(suggestionId);
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  };

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-20 right-6 w-96 max-h-[70vh] overflow-y-auto z-40 animate-slide-in-right">
      <div className="bg-card border border-border rounded-lg shadow-xl">
        <div className="p-4 border-b border-border bg-gradient-to-r from-primary/5 to-primary-light/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Smart Suggestions</h3>
              <Badge variant="processing" className="text-xs">AI-Powered</Badge>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsVisible(false)}
              aria-label="Close suggestions"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Industry-specific recommendations for your operations
          </p>
        </div>

        <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <div 
              key={suggestion.id}
              className={`p-4 border-l-4 ${getCategoryColor(suggestion.category)} bg-muted/30 rounded-r-lg hover:bg-muted/50 transition-colors`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getTypeIcon(suggestion.type)}
                  <h4 className="font-medium text-foreground text-sm">
                    {suggestion.title}
                  </h4>
                </div>
                {getPriorityBadge(suggestion.priority)}
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                {suggestion.description}
              </p>
              
              {suggestion.action && (
                <p className="text-xs text-foreground font-medium mb-3 bg-card p-2 rounded border">
                  💡 {suggestion.action}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {suggestion.category}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {suggestion.type}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDismiss(suggestion.id)}
                    className="text-xs h-7 px-2"
                  >
                    Dismiss
                  </Button>
                  <Button
                    variant="enterprise"
                    size="sm" 
                    onClick={() => handleApply(suggestion)}
                    className="text-xs h-7 px-3"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-border bg-muted/20">
          <div className="text-xs text-muted-foreground text-center">
            Suggestions based on your workflow patterns and industry best practices
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSuggestions;