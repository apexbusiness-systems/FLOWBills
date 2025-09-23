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
  Maximize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  category?: 'general' | 'regulatory' | 'technical' | 'workflow';
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
      id: '1',
      type: 'assistant',
      content: "Hello! I'm your Oil & Gas Billing Assistant. I'm trained on Canadian energy regulations, NOV systems, JIB processes, and industry best practices. How can I help streamline your operations today?",
      timestamp: new Date(),
      category: 'general'
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [perplexityApiKey, setPerplexityApiKey] = useState("");
  const [showApiKeyInput, setShowApiKeyInput] = useState(!perplexityApiKey);
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
      "Joint Interest Billing (JIB) procedures and standards"
    ],
    systems: [
      "NOV AccessNOV portal integration",
      "Oracle E-Business Suite AP modules",
      "SAP Ariba cXML processing",
      "EDI X12 810/820 transactions",
      "Microsoft Dynamics integration patterns"
    ],
    workflows: [
      "Three-way matching (PO, Receipt, Invoice)",
      "Field ticket allocation and JIB distribution", 
      "Working interest calculations",
      "Monthly billing cycles and cutoffs",
      "Exception handling and approval workflows"
    ]
  };

  const quickSuggestions = [
    { text: "Help with JIB allocation", category: "workflow", action: "jib_help" },
    { text: "NOV integration issues", category: "technical", action: "nov_troubleshoot" },
    { text: "Regulatory compliance check", category: "regulatory", action: "compliance_check" },
    { text: "Upload invoice guidance", category: "workflow", action: "upload_help" },
    { text: "Exception resolution steps", category: "workflow", action: "exception_help" }
  ];

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognition.current = new SpeechRecognitionClass();
      recognition.current!.continuous = false;
      recognition.current!.interimResults = false;
      recognition.current!.lang = 'en-US';

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
    if (!perplexityApiKey) {
      return "Please provide your Perplexity API key to get industry-specific assistance.";
    }

    try {
      const systemPrompt = `You are an expert Oil & Gas Billing Assistant specializing in Canadian energy industry operations. You have deep knowledge of:

REGULATORY FRAMEWORK:
- Canadian Energy Regulator (CER) and provincial regulations
- PIPEDA and Alberta PIPA data protection requirements
- Joint Interest Billing (JIB) standards and procedures
- Working interest calculations and allocations

TECHNICAL SYSTEMS:
- NOV (National Oilwell Varco) AccessNOV and MYNOV portals
- Oracle E-Business Suite AP modules and configurations
- EDI X12 810 (Invoice) and 820 (Payment) transactions
- SAP Ariba cXML processing and integration
- Microsoft Dynamics and NetSuite billing modules

OPERATIONAL WORKFLOWS:
- Three-way matching (Purchase Order, Receipt, Invoice)
- Field ticket processing and allocation
- Monthly billing cycles and cutoff procedures
- Exception handling and approval workflows
- Audit trails and compliance reporting

INDUSTRY BEST PRACTICES:
- Cost center allocations and working interest distributions
- Vendor master data management
- Invoice validation and approval hierarchies
- Payment processing and remittance advice
- Dispute resolution and exception management

Provide practical, actionable advice specific to Canadian oil & gas operations. Include regulatory references when relevant and suggest specific workflow improvements.`;

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 1000,
          search_domain_filter: ['canada.ca', 'aer.ca', 'bcogc.ca', 'nov.com'],
          search_recency_filter: 'month',
          frequency_penalty: 1,
          presence_penalty: 0
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try rephrasing your question.";
      
    } catch (error) {
      console.error('AI Assistant Error:', error);
      return "I'm having trouble connecting right now. Here's what I can suggest based on common industry practices: " + getOfflineResponse(userMessage);
    }
  };

  const getOfflineResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('jib') || lowerMessage.includes('allocation')) {
      return "For JIB (Joint Interest Billing): 1) Ensure field tickets are properly coded with AFE numbers, 2) Verify working interest percentages are current, 3) Use the validation rules to check for required fields like well ID and cost center.";
    }
    
    if (lowerMessage.includes('nov') || lowerMessage.includes('access')) {
      return "For NOV integration issues: 1) Check your AccessNOV credentials are current, 2) Verify SFTP connection settings, 3) Ensure CSV export formats match NOV requirements. Contact your NOV administrator for portal access issues.";
    }
    
    if (lowerMessage.includes('upload') || lowerMessage.includes('invoice')) {
      return "For invoice uploads: 1) Ensure files are PDF, Excel, CSV, or XML format, 2) Maximum 20MB file size, 3) Include required fields: invoice number, vendor, amount, PO number, 4) Check for duplicate invoice numbers.";
    }
    
    if (lowerMessage.includes('compliance') || lowerMessage.includes('regulation')) {
      return "For regulatory compliance: 1) Maintain audit trails for all transactions, 2) Ensure PIPEDA compliance for vendor data, 3) Follow CER billing guidelines for regulated activities, 4) Keep records for required retention periods (typically 7 years).";
    }
    
    return "I can help with JIB allocations, NOV integrations, invoice processing, regulatory compliance, and workflow optimization. What specific area would you like assistance with?";
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
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
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      category: 'general'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await generateIndustryResponse(inputMessage);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        category: 'general'
      };

      setMessages(prev => [...prev, assistantMessage]);
      
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

  const handleQuickSuggestion = async (suggestion: typeof quickSuggestions[0]) => {
    setInputMessage(suggestion.text);
    await new Promise(resolve => setTimeout(resolve, 100));
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
      case 'regulatory': return <AlertCircle className="h-4 w-4" />;
      case 'technical': return <FileText className="h-4 w-4" />;
      case 'workflow': return <CheckCircle className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 rounded-full h-14 w-14 p-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-primary to-primary-light text-primary-foreground z-50"
        aria-label="Open Oil & Gas Assistant"
      >
        <Bot className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div className={`fixed bottom-6 left-6 z-50 bg-card border border-border rounded-lg shadow-xl transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">Oil & Gas Assistant</span>
          <Badge variant="processing" className="text-xs">AI-Powered</Badge>
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
          {/* API Key Input */}
          {showApiKeyInput && (
            <div className="p-4 bg-muted/50 border-b border-border">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Perplexity API Key (for industry-specific AI responses)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="Enter your Perplexity API key..."
                    value={perplexityApiKey}
                    onChange={(e) => setPerplexityApiKey(e.target.value)}
                    className="text-xs"
                  />
                  <Button 
                    size="sm"
                    onClick={() => setShowApiKeyInput(false)}
                    disabled={!perplexityApiKey}
                  >
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your API key from <a href="https://perplexity.ai" target="_blank" className="text-primary hover:underline">perplexity.ai</a>
                </p>
              </div>
            </div>
          )}

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
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-foreground'
                }`}>
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
                    if (e.key === 'Enter' && !e.shiftKey) {
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
                  className={isListening ? 'text-destructive' : ''}
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