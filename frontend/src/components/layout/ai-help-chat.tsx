import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Bot, User, Loader2, RefreshCw, X, Minimize2, MessageCircle, HelpCircle, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMarkdown } from "@/components/ui/markdown"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"
import api from "@/lib/api"
import type { ChatMessage } from "@/types"

type ChatSize = "default" | "large" | "full"

const HELP_SUGGESTIONS = [
  "How do I create a work entry?",
  "What is the difference between quarters and sprints?",
  "How do I plan tasks for a sprint?",
  "How can I generate summaries?",
  "What are the validation rules?",
  "How do I mark holidays?",
]

export function AIHelpChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [chatSize, setChatSize] = useState<ChatSize>("default")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { chatSessionId, setChatSessionId, addNotification } = useAppStore()

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Load chat history
  useEffect(() => {
    if (chatSessionId && isOpen) {
      loadChatHistory()
    }
  }, [chatSessionId, isOpen])

  const loadChatHistory = async () => {
    if (!chatSessionId) return
    try {
      const history = await api.getChatHistory(chatSessionId)
      setMessages(Array.isArray(history) ? history : [])
    } catch {
      setMessages([])
    }
  }

  const sendMessage = async (messageText?: string) => {
    const userMessage = (messageText || input).trim()
    if (!userMessage || isLoading) return

    setInput("")
    setIsLoading(true)

    // Add user message immediately
    const tempUserMessage: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: chatSessionId || "",
      role: "user",
      message: userMessage,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUserMessage])

    try {
      // Add context about help request
      const contextMessage = `[HELP REQUEST] User needs help with FY Work Management app. ${userMessage}`
      
      const response = await api.sendChatMessage({
        message: contextMessage,
        session_id: chatSessionId || undefined,
      })

      if (!chatSessionId) {
        setChatSessionId(response.session_id)
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        session_id: response.session_id,
        role: "assistant",
        message: response.response,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error(error);
      addNotification("error", "Failed to send message. Please try again.")
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id))
      setInput(userMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startNewChat = () => {
    setChatSessionId(null)
    setMessages([])
  }

  const toggleOpen = () => {
    setIsOpen(!isOpen)
    setIsMinimized(false)
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const toggleSize = () => {
    if (chatSize === "default") {
      setChatSize("large")
    } else if (chatSize === "large") {
      setChatSize("full")
    } else {
      setChatSize("default")
    }
  }

  const getSizeClasses = () => {
    if (isMinimized) return "h-14 w-80"
    
    switch (chatSize) {
      case "large":
        return "h-[700px] w-[500px]"
      case "full":
        return "h-[90vh] w-[800px] max-w-[90vw]"
      default:
        return "h-[600px] w-[400px]"
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleOpen}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-foreground"></span>
            </span>
          </div>
        </Button>
      </div>
    )
  }

  return (
    <div className={cn(
      "fixed z-50 transition-all duration-300",
      chatSize === "full" ? "bottom-6 right-6 left-6 flex justify-center" : "bottom-6 right-6"
    )}>
      <div
        className={cn(
          "flex flex-col bg-card border border-border rounded-lg shadow-2xl transition-all duration-300",
          getSizeClasses()
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5 rounded-t-lg">
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/20 p-1.5">
              <HelpCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">Help Assistant</h3>
                {!isMinimized && chatSize !== "default" && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                    {chatSize === "large" ? "Large" : "Full"}
                  </Badge>
                )}
              </div>
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Powered
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isMinimized && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={startNewChat}
                  className="h-8 w-8"
                  title="New chat"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleSize}
                  className="h-8 w-8"
                  title={
                    chatSize === "default" 
                      ? "Expand to large" 
                      : chatSize === "large" 
                      ? "Expand to full screen" 
                      : "Restore to default"
                  }
                >
                  <Maximize2 className={cn(
                    "h-4 w-4 transition-transform",
                    chatSize === "large" && "scale-125",
                    chatSize === "full" && "scale-150"
                  )} />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMinimize}
              className="h-8 w-8"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {!messages || messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center px-4">
                  <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-6 mb-4 border-2 border-primary/20">
                    <Bot className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Hi! I'm your AI Help Assistant 👋</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    I can help you understand and use the FY Work Management app. Ask me anything!
                  </p>
                  <div className="space-y-2 w-full">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Quick questions:</p>
                    {HELP_SUGGESTIONS.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => sendMessage(suggestion)}
                        className="w-full text-left text-xs p-2 rounded-md border border-border hover:bg-accent hover:border-primary/50 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {(messages || []).map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === "user" ? "flex-row-reverse" : ""
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          message.role === "user"
                            ? "bg-primary"
                            : "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
                        )}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4 text-primary-foreground" />
                        ) : (
                          <Bot className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 max-w-[85%]",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-gradient-to-br from-muted to-muted/50 border border-border/50"
                        )}
                      >
                        {message.role === "user" ? (
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        ) : (
                          <div className="text-sm">
                            <ChatMarkdown content={message.message} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                        <Bot className="h-4 w-4 text-primary animate-pulse" />
                      </div>
                      <div className="rounded-lg bg-gradient-to-br from-muted to-muted/50 border border-border/50 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border p-3 w-full">
              <div className="flex gap-2 items-center">
                <div className="flex-1 min-w-0">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about the app..."
                    className="w-full min-h-[44px] max-h-32 resize-none text-sm"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="shrink-0 h-[44px] w-[44px]"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send,{" "}
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift+Enter</kbd> for new line
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
