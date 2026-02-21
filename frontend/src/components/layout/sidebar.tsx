import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Calendar,
  FileText,
  ListTodo,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import logoSvg from "@/assets/logo.svg"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/stores/app-store"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Overview & AI insights",
  },
  {
    title: "Calendar",
    href: "/calendar",
    icon: Calendar,
    description: "FY calendar view",
  },
  {
    title: "Work Entries",
    href: "/work",
    icon: FileText,
    description: "Daily work logs",
  },
  {
    title: "Planned Tasks",
    href: "/planned",
    icon: ListTodo,
    description: "Sprint & week planning",
  },
  {
    title: "Summary",
    href: "/summary",
    icon: BarChart3,
    description: "Reports & analytics",
  },
]

const bottomNavItems = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Configuration",
  },
]

export function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-border px-4",
          sidebarOpen ? "justify-between" : "justify-center"
        )}>
          {sidebarOpen ? (
            <>
              <Link to="/" className="flex items-center gap-2">
                <img src={logoSvg} alt="FY Work" className="h-8 w-8 rounded-lg" />
                <span className="text-lg font-bold tracking-tight">FY Work</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="icon" onClick={toggleSidebar}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== "/" && location.pathname.startsWith(item.href))
              
              const linkContent = (
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    !sidebarOpen && "justify-center px-2"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                  {sidebarOpen && <span>{item.title}</span>}
                  {isActive && sidebarOpen && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              )

              if (!sidebarOpen) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" className="flex flex-col">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return <div key={item.href}>{linkContent}</div>
            })}
          </div>
        </nav>

        {/* Bottom navigation */}
        <div className="border-t border-border p-3">
          {sidebarOpen && (
            <div className="mb-3 rounded-xl bg-gradient-to-br from-[#3b82f6]/20 via-[#1d4ed8]/15 to-[#60a5fa]/10 p-3 border border-[#3b82f6]/20">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8]">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <span className="text-xs font-semibold text-[#60a5fa]">AI Powered</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Enhanced summaries & insights
              </p>
            </div>
          )}
          
          <Separator className="mb-3" />
          
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.href
            
            const linkContent = (
              <Link
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  !sidebarOpen && "justify-center px-2"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span>{item.title}</span>}
              </Link>
            )

            if (!sidebarOpen) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right">
                    <span>{item.title}</span>
                  </TooltipContent>
                </Tooltip>
              )
            }

            return <div key={item.href}>{linkContent}</div>
          })}
        </div>
      </aside>
    </TooltipProvider>
  )
}
