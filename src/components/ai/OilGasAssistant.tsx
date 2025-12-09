import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  Mic,
  MicOff,
  Send,
  Bot,
  Lightbulb,
  FileText,
  AlertCircle,
  CheckCircle,
  Volume2,
  VolumeX,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  category?: "general" | "regulatory" | "technical" | "workflow";
}

interface OilGasAssistantProps {
  onTaskSuggestion?: (task: string) => void;
  onNavigate?: (section: string) => void;
}

const OilGasAssistant = ({ onTaskSuggestion, onNavigate }: OilGasAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hello! I'm your Oil & Gas Billing Assistant. I'm trained on Canadian energy regulations, NOV systems, JIB processes, and industry best practices. How can I help streamline your operations today?",
      timestamp: new Date(),
      category: "general",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Removed insecure API key handling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<any>(null);
  const synthesis = useRef<SpeechSynthesis>(window.speechSynthesis);
  const { toast } = useToast();

  const industryKnowledge = {
    regulations: [
      "Canadian Energy Regulator (CER) billing requirements",
      "Alberta Energy Regulator (AER) fee structures",
      "British Columbia Oil and Gas Commission regulations",
      "PIPEDA and Alberta PIPA compliance for billing data",
      "Joint Interest Billing (JIB) procedures and standards",
    ],
    systems: [
      "NOV AccessNOV portal integration",
      "Oracle E-Business Suite AP modules",
      "SAP Ariba cXML processing",
      "EDI X12 810/820 transactions",
      "Microsoft Dynamics integration patterns",
    ],
    workflows: [
      "Three-way matching (PO, Receipt, Invoice)",
      "Field ticket allocation and JIB distribution",
      "Working interest calculations",
      "Monthly billing cycles and cutoffs",
      "Exception handling and approval workflows",
    ],
  };

  const quickSuggestions = [
    { text: "JIB allocation help", category: "workflow", action: "jib_help" },
    { text: "NOV troubleshooting", category: "technical", action: "nov_troubleshoot" },
    { text: "Compliance check", category: "regulatory", action: "compliance_check" },
    { text: "Smart upload guide", category: "workflow", action: "upload_help" },
    { text: "Workflow automation", category: "workflow", action: "automation_help" },
    { text: "Performance analytics", category: "technical", action: "analytics_help" },
  ];

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition.current = new SpeechRecognitionClass();
      recognition.current!.continuous = false;
      recognition.current!.interimResults = false;
      recognition.current!.lang = "en-US";

      recognition.current!.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognition.current!.onerror = () => {
        setIsListening(false);
        toast({
          title: "Voice recognition error",
          description: "Please try again or type your message.",
          variant: "destructive",
        });
      };
    }

    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const generateIndustryResponse = async (userMessage: string): Promise<string> => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        return "Please sign in to access AI assistance.";
      }

      // Enhanced context with conversation history and industry knowledge
      const conversationContext = messages
        .slice(-5) // Last 5 messages for context
        .map((m) => `${m.type}: ${m.content}`)
        .join("\n");

      const enhancedContext = `
You are an expert Oil & Gas Billing AI Assistant with deep knowledge of:

INDUSTRY EXPERTISE:
- Canadian Energy Regulator (CER) billing requirements and compliance
- Joint Interest Billing (JIB) procedures and working interest calculations
- NOV AccessNOV integration patterns and troubleshooting
- PIPEDA/PIPA data privacy compliance for billing systems
- Oracle E-Business Suite, SAP Ariba, and EDI X12 810/820 transactions

CURRENT CONVERSATION:
${conversationContext}

RESPONSE GUIDELINES:
- Provide specific, actionable solutions
- Reference relevant regulations and industry standards
- Suggest next steps and potential automation opportunities
- Be conversational but professional
- If unsure, ask clarifying questions

USER QUESTION: ${userMessage}`;

      const response = await supabase.functions.invoke("ai-assistant", {
        body: {
          prompt: enhancedContext,
          context: "Advanced Oil & Gas Billing Expert",
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        console.error("AI Assistant error:", response.error);
        return getSmartOfflineResponse(userMessage);
      }

      return response.data?.response || getSmartOfflineResponse(userMessage);
    } catch (error) {
      console.error("AI Assistant Error:", error);
      return getSmartOfflineResponse(userMessage);
    }
  };

  const getSmartOfflineResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("jib") || lowerMessage.includes("allocation")) {
      return `📊 **JIB Allocation Guidance**

**Step-by-step process:**
1. **Verify AFE Numbers**: Ensure field tickets have valid Authorization for Expenditure codes
2. **Working Interest Check**: Confirm current WI percentages in your master data (typical range 0.1%-100%)
3. **Cost Center Validation**: Map activities to proper GL accounts (OPEX vs CAPEX classification)
4. **Regulatory Compliance**: Follow CER guidelines for upstream cost allocation

**Common Issues & Solutions:**
- Missing well identifiers → Use UWI (Unique Well Identifier) format
- Incorrect allocation basis → Verify net revenue interest vs gross working interest
- Data quality issues → Implement validation rules for mandatory fields

**Next Steps:** Would you like me to help set up automated validation rules for your JIB process?`;
    }

    if (lowerMessage.includes("nov") || lowerMessage.includes("access")) {
      return `🔗 **NOV AccessNOV Integration Support**

**Connection Troubleshooting:**
1. **Authentication**: Verify your NOV credentials haven't expired (90-day rotation policy)
2. **Network Access**: Check firewall rules for SFTP ports (typically 22 or 2222)
3. **File Format**: Ensure CSV exports match NOV's required schema v2.1+

**Common Integration Patterns:**
- **Real-time sync**: Use NOV's REST API for invoice status updates
- **Batch processing**: Schedule nightly SFTP transfers for bulk data
- **Error handling**: Implement retry logic for failed transmissions

**Pro Tips:**
- Enable NOV webhook notifications for faster processing
- Use their sandbox environment for testing new integrations
- Keep audit logs for all NOV transactions (compliance requirement)

Need help with specific error codes or want me to review your integration setup?`;
    }

    if (lowerMessage.includes("upload") || lowerMessage.includes("invoice")) {
      return `📋 **Smart Invoice Upload Guide**

**Supported Formats & Optimization:**
- **PDF**: OCR-enabled, max 20MB (use PDF/A format for best results)
- **Excel**: .xlsx preferred, validate formulas before upload
- **CSV**: UTF-8 encoding, comma-separated (avoid special characters)
- **XML**: cXML 1.2+ for enterprise integrations

**Required Data Fields:**
✅ Invoice Number (unique, max 30 chars)
✅ Vendor Code (must exist in master data)
✅ Line Amount (CAD, 2 decimal precision)
✅ PO Number (for 3-way matching)
✅ GL Account (valid chart of accounts)

**AI-Powered Enhancements:**
- Auto-extract data using OCR technology
- Duplicate detection across historical invoices
- Smart vendor matching with fuzzy logic
- Automatic tax calculation for Canadian provinces

**Validation Rules Setup:** Want me to help configure custom validation rules for your workflow?`;
    }

    if (lowerMessage.includes("compliance") || lowerMessage.includes("regulation")) {
      return `🛡️ **Regulatory Compliance Center**

**Canadian Energy Compliance Stack:**
- **CER Requirements**: Maintain detailed cost records, audit-ready documentation
- **PIPEDA/PIPA**: Encrypt PII data, implement data retention policies
- **Provincial Tax**: Auto-calculate GST/HST/PST based on jurisdiction
- **SOX Controls**: Segregation of duties, approval workflows

**Compliance Automation Features:**
- **Audit Trail**: Immutable record of all invoice changes
- **Data Encryption**: AES-256 for data at rest and in transit
- **Access Controls**: Role-based permissions with MFA
- **Retention Management**: Auto-archive records after 7 years

**Risk Monitoring:**
- Real-time compliance scoring
- Automated alerts for policy violations
- Regular compliance health checks
- Integration with legal hold processes

**Compliance Dashboard:** Would you like me to show you the compliance monitoring tools and help set up automated reporting?`;
    }

    if (lowerMessage.includes("workflow") || lowerMessage.includes("automation")) {
      return `⚡ **Intelligent Workflow Automation**

**Pre-built Workflow Templates:**
- **3-Way Matching**: PO → Receipt → Invoice validation
- **Exception Handling**: Smart routing based on dollar thresholds
- **Approval Chains**: Dynamic routing based on cost centers
- **Integration Flows**: Seamless NOV, Oracle, SAP connections

**AI-Enhanced Features:**
- **Smart Classification**: Auto-categorize invoices by type and priority
- **Predictive Analytics**: Forecast processing times and bottlenecks
- **Learning Algorithms**: Improve accuracy over time based on user feedback
- **Natural Language**: Configure workflows using plain English

**Performance Metrics:**
- Average processing time: 2.3 hours → 12 minutes
- Exception rate: 15% → 3% (with AI optimization)
- Approval cycle: 5 days → same day processing

Ready to build a custom workflow? I can guide you through the visual workflow builder!`;
    }

    return `👋 **Hi! I'm your Advanced Oil & Gas Billing Assistant**

I specialize in Canadian energy industry operations and can help with:

🔧 **Technical Support**
- NOV AccessNOV integrations and troubleshooting  
- Oracle/SAP billing system configurations
- EDI X12 810/820 transaction processing

📊 **Regulatory & Compliance**
- CER billing requirements and reporting
- PIPEDA/PIPA data privacy compliance
- JIB procedures and working interest calculations

🚀 **Process Optimization**
- Workflow automation and AI enhancements
- Exception handling and approval routing  
- Performance analytics and reporting

**What would you like to explore?** Just ask me anything about billing operations, regulations, or system integrations!`;
  };

  const speakMessage = (text: string) => {
    if ("speechSynthesis" in window) {
      synthesis.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);

      synthesis.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    synthesis.current.cancel();
    setIsSpeaking(false);
  };

  const startListening = () => {
    if (recognition.current) {
      setIsListening(true);
      recognition.current.start();
    } else {
      toast({
        title: "Voice recognition not supported",
        description: "Please type your message instead.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (recognition.current) {
      recognition.current.stop();
    }
    setIsListening(false);
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
      category: "general",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await generateIndustryResponse(inputMessage);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response,
        timestamp: new Date(),
        category: "general",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-speak response if it's short enough
      if (response.length < 200) {
        speakMessage(response);
      }
    } catch (error) {
      toast({
        title: "Assistant Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSuggestion = async (suggestion: (typeof quickSuggestions)[0]) => {
    setInputMessage(suggestion.text);
    await new Promise((resolve) => setTimeout(resolve, 100));
    sendMessage();

    // Navigate to relevant section if applicable
    if (suggestion.action === "upload_help") {
      onNavigate?.("inbox");
    } else if (suggestion.action === "exception_help") {
      onNavigate?.("exceptions");
    } else if (suggestion.action === "compliance_check") {
      onNavigate?.("compliance");
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "regulatory":
        return <AlertCircle className="h-4 w-4" />;
      case "technical":
        return <FileText className="h-4 w-4" />;
      case "workflow":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full h-14 w-14 p-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground z-50 animate-pulse"
        aria-label="Open AI Assistant"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 bg-card border border-border rounded-lg shadow-xl transition-all duration-300 ${
        isMinimized ? "w-80 h-16" : "w-96 h-[600px]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Oil & Gas Assistant</span>
          <Badge variant="processing" className="text-xs">
            AI-Powered
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          {isSpeaking && (
            <Button variant="ghost" size="sm" onClick={stopSpeaking}>
              {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setIsMinimized(!isMinimized)}>
            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            ×
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Secure AI Assistant - No API key needed */}

          {/* Quick Suggestions */}
          <div className="p-3 border-b border-border">
            <div className="flex flex-wrap gap-2">
              {quickSuggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSuggestion(suggestion)}
                  className="text-xs h-7 px-2 hover-scale"
                >
                  {getCategoryIcon(suggestion.category)}
                  {suggestion.text}
                </Button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-80">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.type === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                    <span className="text-sm">Analyzing your request...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about JIB, NOV integration, regulations, workflows..."
                  className="min-h-[40px] max-h-[80px] resize-none pr-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isListening ? stopListening : startListening}
                  className={isListening ? "text-destructive" : ""}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OilGasAssistant;
