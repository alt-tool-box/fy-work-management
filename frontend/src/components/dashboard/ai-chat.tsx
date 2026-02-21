import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Bot, User, Loader2, RefreshCw } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMarkdown } from "@/components/ui/markdown"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"
import api from "@/lib/api"
import type { ChatMessage } from "@/types"

export function AIChat() {
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
    if (chatSessionId) {
      loadChatHistory()
    }
  }, [chatSessionId])

  const loadChatHistory = async () => {
    if (!chatSessionId) return
    try {
      const history = await api.getChatHistory(chatSessionId)
      setMessages(Array.isArray(history) ? history : [])
    } catch {
      // Ignore error if no history exists
      setMessages([])
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
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
      const response = await api.sendChatMessage({
        message: userMessage,
        session_id: chatSessionId || undefined,
      })

      // Save session ID if new
      if (!chatSessionId) {
        setChatSessionId(response.session_id)
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        session_id: response.session_id,
        role: "assistant",
        message: response.response,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      addNotification("error", "Failed to send message. Please try again.")
      // Remove the user message on error
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

  return (
    <Card className="flex h-[500px] flex-col" id="chat">
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Assistant
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={startNewChat}
            className="text-muted-foreground"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            New Chat
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-0">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {!messages || messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="rounded-full bg-primary/10 p-4 mb-4">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">AI Work Assistant</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Ask me about your work, get summaries, or request insights about your productivity.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {[
                  "What did I work on last week?",
                  "Summarize my sprint progress",
                  "Show productivity insights",
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setInput(suggestion)}
                  >
                    {suggestion}
                  </Button>
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
                      message.role === "user" ? "bg-primary" : "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
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
                      "rounded-lg px-4 py-3 max-w-[85%]",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-gradient-to-br from-muted to-muted/50 border border-border/50"
                    )}
                  >
                    {message.role === "user" ? (
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    ) : (
                      <ChatMarkdown content={message.message} />
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                    <Bot className="h-4 w-4 text-primary animate-pulse" />
                  </div>
                  <div className="rounded-lg bg-gradient-to-br from-muted to-muted/50 border border-border/50 px-4 py-3">
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
        <div className="border-t border-border p-4 w-full">
          <div className="flex gap-2 items-center">
            <div className="flex-1 min-w-0">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your work..."
                className="w-full min-h-[44px] max-h-32 resize-none"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={sendMessage}
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
        </div>
      </CardContent>
    </Card>
  )
}
