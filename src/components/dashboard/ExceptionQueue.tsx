import { useState } from "react";
import { 
  AlertTriangle, 
  FileText, 
  User, 
  DollarSign, 
  CheckCircle, 
  X,
  Eye,
  MessageSquare,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Exception {
  id: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  issue: string;
  severity: "high" | "medium" | "low";
  assignedTo?: string;
  created: string;
  lastUpdate: string;
  description: string;
  comments: Comment[];
  status: "open" | "in_progress" | "resolved" | "escalated";
}

interface Comment {
  id: string;
  user: string;
  text: string;
  timestamp: string;
}

const mockExceptions: Exception[] = [
  {
    id: "EXC-001",
    invoiceNumber: "INV-2024-0847",
    vendor: "Husky Energy Services",
    amount: 45250.00,
    issue: "PO number mismatch",
    severity: "high",
    assignedTo: "Sarah Chen",
    created: "2024-03-15 09:30:00",
    lastUpdate: "2024-03-15 14:22:00",
    description: "Invoice PO number 'PO-789456' does not match expected format or existing PO records",
    comments: [
      {
        id: "1",
        user: "Sarah Chen",
        text: "Contacted vendor to verify PO number. Awaiting response.",
        timestamp: "2024-03-15 14:22:00"
      }
    ],
    status: "in_progress"
  },
  {
    id: "EXC-002", 
    invoiceNumber: "INV-2024-0848",
    vendor: "Suncor Energy",
    amount: 127830.45,
    issue: "Amount exceeds PO tolerance",
    severity: "medium",
    created: "2024-03-15 11:15:00",
    lastUpdate: "2024-03-15 11:15:00",
    description: "Invoice amount $127,830.45 exceeds PO amount $125,000.00 by 2.26% (tolerance: 2%)",
    comments: [],
    status: "open"
  },
  {
    id: "EXC-003",
    invoiceNumber: "INV-2024-0849", 
    vendor: "Canadian Natural Resources",
    amount: 89450.00,
    issue: "Missing field ticket reference",
    severity: "low",
    assignedTo: "Mike Rodriguez",
    created: "2024-03-15 13:45:00",
    lastUpdate: "2024-03-15 13:45:00",
    description: "No field ticket reference found for this service invoice. Required for JIB allocation.",
    comments: [],
    status: "open"
  }
];

const ExceptionQueue = () => {
  const [exceptions, setExceptions] = useState<Exception[]>(mockExceptions);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedException, setSelectedException] = useState<Exception | null>(null);
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return <Badge variant="rejected">High</Badge>;
      case "medium":
        return <Badge variant="pending">Medium</Badge>;
      case "low":
        return <Badge variant="processing">Low</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge variant="rejected">Open</Badge>;
      case "in_progress":
        return <Badge variant="pending">In Progress</Badge>;
      case "resolved":
        return <Badge variant="approved">Resolved</Badge>;
      case "escalated":
        return <Badge variant="destructive">Escalated</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-CA');
  };

  const resolveException = (exceptionId: string) => {
    setExceptions(prev => prev.map(exc =>
      exc.id === exceptionId 
        ? { ...exc, status: "resolved", lastUpdate: new Date().toISOString() }
        : exc
    ));
    setSelectedException(null);
    toast({
      title: "Exception resolved",
      description: "The exception has been marked as resolved.",
    });
  };

  const assignException = (exceptionId: string, assignee: string) => {
    setExceptions(prev => prev.map(exc =>
      exc.id === exceptionId 
        ? { ...exc, assignedTo: assignee, status: "in_progress", lastUpdate: new Date().toISOString() }
        : exc
    ));
    toast({
      title: "Exception assigned",
      description: `Exception assigned to ${assignee}.`,
    });
  };

  const addComment = () => {
    if (!selectedException || !newComment.trim()) return;

    const comment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      user: "Current User",
      text: newComment.trim(),
      timestamp: new Date().toISOString()
    };

    setExceptions(prev => prev.map(exc =>
      exc.id === selectedException.id
        ? { 
            ...exc, 
            comments: [...exc.comments, comment],
            lastUpdate: new Date().toISOString()
          }
        : exc
    ));

    setSelectedException(prev => prev ? {
      ...prev,
      comments: [...prev.comments, comment]
    } : null);

    setNewComment("");
    toast({
      title: "Comment added",
      description: "Your comment has been added to the exception.",
    });
  };

  const filteredExceptions = exceptions.filter(exc => {
    if (selectedFilter === "all") return true;
    if (selectedFilter === "unassigned") return !exc.assignedTo;
    return exc.severity === selectedFilter || exc.status === selectedFilter;
  });

  const stats = {
    total: exceptions.length,
    open: exceptions.filter(e => e.status === "open").length,
    inProgress: exceptions.filter(e => e.status === "in_progress").length,
    high: exceptions.filter(e => e.severity === "high").length
  };

  return (
    <div className="card-enterprise">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Exception Queue
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="rejected">{stats.open} Open</Badge>
            <Badge variant="pending">{stats.inProgress} In Progress</Badge>
            <Badge variant="destructive">{stats.high} High Priority</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Review and resolve invoice processing exceptions
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: "all", label: "All" },
          { key: "open", label: "Open" },
          { key: "in_progress", label: "In Progress" },
          { key: "high", label: "High Priority" },
          { key: "unassigned", label: "Unassigned" }
        ].map(filter => (
          <Button
            key={filter.key}
            variant={selectedFilter === filter.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedFilter(filter.key)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Exception List */}
      <div className="space-y-3">
        {filteredExceptions.map((exception) => (
          <div 
            key={exception.id}
            className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-sm font-medium text-foreground">
                    {exception.invoiceNumber}
                  </h4>
                  {getSeverityBadge(exception.severity)}
                  {getStatusBadge(exception.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {exception.vendor}
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    {formatCurrency(exception.amount)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatDateTime(exception.created)}
                  </div>
                </div>

                <p className="text-sm font-medium text-foreground mb-2">
                  Issue: {exception.issue}
                </p>
                <p className="text-sm text-muted-foreground">
                  {exception.description}
                </p>

                {exception.assignedTo && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Assigned to: <span className="font-medium">{exception.assignedTo}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedException(exception)}
                  aria-label="View details"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resolveException(exception.id)}
                  aria-label="Resolve exception"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Exception Detail Modal */}
      {selectedException && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background border border-border rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Exception Details: {selectedException.invoiceNumber}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedException(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Vendor</label>
                  <p className="text-sm text-foreground">{selectedException.vendor}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Amount</label>
                  <p className="text-sm text-foreground">{formatCurrency(selectedException.amount)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Issue</label>
                <p className="text-sm text-foreground">{selectedException.issue}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm text-foreground">{selectedException.description}</p>
              </div>

              {/* Comments */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Comments</label>
                <div className="space-y-2 mt-2">
                  {selectedException.comments.map(comment => (
                    <div key={comment.id} className="border border-border rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{comment.user}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(comment.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{comment.text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-3">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-2"
                  />
                  <Button size="sm" onClick={addComment} disabled={!newComment.trim()}>
                    <MessageSquare className="h-4 w-4" />
                    Add Comment
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-border">
                <Button
                  variant="enterprise"
                  onClick={() => resolveException(selectedException.id)}
                >
                  <CheckCircle className="h-4 w-4" />
                  Resolve
                </Button>
                <Button
                  variant="outline"
                  onClick={() => assignException(selectedException.id, "Current User")}
                >
                  Assign to Me
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExceptionQueue;