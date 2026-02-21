import { Outlet } from "react-router-dom"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { AISidebar } from "./ai-sidebar"
import { Toaster } from "@/components/ui/toaster"

export function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden gradient-mesh">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
      <AISidebar />
      <Toaster />
    </div>
  )
}
