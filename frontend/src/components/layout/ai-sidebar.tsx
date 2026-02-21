import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Bot, User, Loader2, RefreshCw, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMarkdown } from "@/components/ui/markdown"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"
import api from "@/lib/api"
import type { ChatMessage } from "@/types"

const STORAGE_KEY = "ai-sidebar-width"
const DEFAULT_WIDTH = 384 // 24rem

export function AISidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [width, setWidth] = useState(() => {
    // Load saved width from localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH
  })
  const [isResizing, setIsResizing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { chatSessionId, setChatSessionId, addNotification } = useAppStore()

  // Min and max width constraints
  const MIN_WIDTH = 320 // 20rem
  const MAX_WIDTH = 800 // 50rem

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
      console.error(error)
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

  // Save width to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, width.toString())
  }, [width])

  // Resize handlers
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newWidth = window.innerWidth - e.clientX
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "ew-resize"
      document.body.style.userSelect = "none"
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizing, MIN_WIDTH, MAX_WIDTH])

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-3 rounded-l-lg shadow-lg hover:shadow-xl transition-all duration-300 z-40 hover:pr-4 group"
          aria-label="Open AI Assistant"
        >
          <div className="flex flex-col items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <div className="[writing-mode:vertical-rl] text-[10px] font-medium rotate-180">
              AI Assistant
            </div>
          </div>
        </button>
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed right-0 top-0 h-screen bg-card border-l border-border shadow-2xl z-50 flex flex-col",
          isOpen ? "" : "w-0",
          !isOpen && "transition-all duration-300"
        )}
        style={isOpen ? { width: `${width}px` } : undefined}
      >
        {isOpen && (
          <>
            {/* Resize Handle */}
            <div
              onMouseDown={startResizing}
              className={cn(
                "absolute left-0 top-0 bottom-0 w-1 hover:w-1.5 bg-border hover:bg-primary cursor-ew-resize transition-all group z-10",
                isResizing && "w-1.5 bg-primary"
              )}
              title="Drag to resize"
            >
              {/* Visual grip indicator */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="flex flex-col gap-1 px-0.5">
                  <div className="w-0.5 h-1 bg-primary-foreground rounded-full" />
                  <div className="w-0.5 h-1 bg-primary-foreground rounded-full" />
                  <div className="w-0.5 h-1 bg-primary-foreground rounded-full" />
                </div>
              </div>
            </div>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/20 p-2">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">AI Assistant</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    <span>Work & Help</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
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
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                  title="Close"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {!messages || messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-6 mb-4 border-2 border-primary/20">
                    <Bot className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">AI Assistant</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mb-4">
                    Ask me about your work, get summaries, learn how to use the app, or request productivity insights.
                  </p>
                  <div className="space-y-2 w-full max-w-xs">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Try asking:</p>
                    {[
                      "What did I work on last week?",
                      "Summarize my sprint progress",
                      "How do I create a work entry?",
                      "Explain the quarter-sprint hierarchy",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInput(suggestion)}
                        className="w-full text-left text-xs p-2.5 rounded-md border border-border hover:bg-accent hover:border-primary/50 transition-colors"
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
              <p className="text-xs text-muted-foreground mt-2">
                Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send
              </p>
            </div>
          </>
        )}
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className={cn(
            "fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300",
            isResizing && "cursor-ew-resize"
          )}
          onClick={() => !isResizing && setIsOpen(false)}
        />
      )}

      {/* Resize indicator */}
      {isResizing && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          {width}px
        </div>
      )}
    </>
  )
}
