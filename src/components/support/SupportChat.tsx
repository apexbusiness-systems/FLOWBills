import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRealtimeChat } from "@/hooks/useRealtimeChat";
import { Mic, MicOff, Send, Phone, PhoneOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

interface SupportChatProps {
  isMinimized?: boolean;
  onMinimize?: () => void;
}

export const SupportChat: React.FC<SupportChatProps> = ({ isMinimized, onMinimize }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isConnected,
    isListening,
    isSpeaking,
    isLoading,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendTextMessage,
  } = useRealtimeChat();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleConnect = async () => {
    try {
      await connect();
      toast({
        title: t("support.connected") || "Connected",
        description: t("support.connectedDesc") || "AI support is ready to help you 24/7",
      });
    } catch (error) {
      toast({
        title: t("support.error") || "Connection Error",
        description: error instanceof Error ? error.message : "Failed to connect",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: t("support.disconnected") || "Disconnected",
      description: t("support.disconnectedDesc") || "Support chat ended",
    });
  };

  const handleToggleListening = async () => {
    try {
      if (isListening) {
        stopListening();
      } else {
        await startListening();
        toast({
          title: t("support.listening") || "Listening",
          description: t("support.listeningDesc") || "Speak now, I'm listening...",
        });
      }
    } catch (error) {
      toast({
        title: t("support.error") || "Error",
        description: error instanceof Error ? error.message : "Microphone access failed",
        variant: "destructive",
      });
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !isConnected) return;

    try {
      sendTextMessage(inputText);
      setInputText("");
    } catch (error) {
      toast({
        title: t("support.error") || "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    }
  };

  if (isMinimized) {
    return (
      <Button
        onClick={onMinimize}
        className="fixed bottom-4 right-4 rounded-full w-16 h-16 shadow-lg z-[9999]"
        size="icon"
      >
        <Phone className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 h-[600px] flex flex-col shadow-2xl z-[9999] bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{t("support.title") || "24/7 AI Support"}</h3>
            <p className="text-sm opacity-90">
              {isConnected
                ? isSpeaking
                  ? t("support.speaking") || "Speaking..."
                  : t("support.online") || "Online"
                : t("support.offline") || "Offline"}
            </p>
          </div>
          {onMinimize && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMinimize}
              className="text-primary-foreground"
            >
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 && !isConnected && (
          <div className="text-center text-muted-foreground py-8">
            <p>{t("support.welcome") || "Welcome to 24/7 AI Support"}</p>
            <p className="text-sm mt-2">
              {t("support.welcomeDesc") || "Connect to start chatting with voice or text"}
            </p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 ${message.role === "user" ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-block p-3 rounded-lg max-w-[80%] ${
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {message.content}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {/* Controls */}
      <div className="p-4 border-t space-y-2">
        {!isConnected ? (
          <Button onClick={handleConnect} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("support.connecting") || "Connecting..."}
              </>
            ) : (
              <>
                <Phone className="w-4 h-4 mr-2" />
                {t("support.connect") || "Connect to Support"}
              </>
            )}
          </Button>
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                onClick={handleToggleListening}
                variant={isListening ? "destructive" : "secondary"}
                className="flex-1"
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    {t("support.stopListening") || "Stop"}
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    {t("support.startListening") || "Voice"}
                  </>
                )}
              </Button>
              <Button onClick={handleDisconnect} variant="outline">
                <PhoneOff className="w-4 h-4" />
              </Button>
            </div>

            <form onSubmit={handleSendText} className="flex gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t("support.typePlaceholder") || "Type a message..."}
                disabled={!isConnected}
              />
              <Button type="submit" size="icon" disabled={!inputText.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </>
        )}
      </div>
    </Card>
  );
};
