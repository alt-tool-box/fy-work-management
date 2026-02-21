import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Sprint, Quarter, DashboardStats } from "@/types"

interface AppState {
  // Theme
  theme: "dark" | "light"
  setTheme: (theme: "dark" | "light") => void
  toggleTheme: () => void

  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Current context
  currentYear: number
  setCurrentYear: (year: number) => void
  currentSprint: Sprint | null
  setCurrentSprint: (sprint: Sprint | null) => void
  currentQuarter: Quarter | null
  setCurrentQuarter: (quarter: Quarter | null) => void

  // Dashboard stats (cached)
  dashboardStats: DashboardStats | null
  setDashboardStats: (stats: DashboardStats | null) => void

  // Chat session
  chatSessionId: string | null
  setChatSessionId: (id: string | null) => void

  // Loading states
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Notifications
  notifications: Array<{
    id: string
    type: "success" | "error" | "warning" | "info"
    message: string
    timestamp: number
  }>
  addNotification: (type: "success" | "error" | "warning" | "info", message: string) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme - default to dark
      theme: "dark",
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),

      // Sidebar
      sidebarOpen: true,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

      // Current context
      currentYear: new Date().getFullYear(),
      setCurrentYear: (currentYear) => set({ currentYear }),
      currentSprint: null,
      setCurrentSprint: (currentSprint) => set({ currentSprint }),
      currentQuarter: null,
      setCurrentQuarter: (currentQuarter) => set({ currentQuarter }),

      // Dashboard stats
      dashboardStats: null,
      setDashboardStats: (dashboardStats) => set({ dashboardStats }),

      // Chat session
      chatSessionId: null,
      setChatSessionId: (chatSessionId) => set({ chatSessionId }),

      // Loading
      isLoading: false,
      setIsLoading: (isLoading) => set({ isLoading }),

      // Notifications
      notifications: [],
      addNotification: (type, message) => {
        const id = crypto.randomUUID()
        set({
          notifications: [
            ...get().notifications,
            { id, type, message, timestamp: Date.now() },
          ],
        })
        // Auto-remove after 5 seconds
        setTimeout(() => {
          get().removeNotification(id)
        }, 5000)
      },
      removeNotification: (id) =>
        set({
          notifications: get().notifications.filter((n) => n.id !== id),
        }),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: "fy-work-management-storage",
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        currentYear: state.currentYear,
        chatSessionId: state.chatSessionId,
      }),
    }
  )
)
