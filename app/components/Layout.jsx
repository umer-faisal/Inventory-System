"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, Package, TrendingUp, FileText, LogOut, Menu, X, Users, UserCircle, ArrowRightLeft, Upload, ShoppingCart } from "lucide-react"
import Image from "next/image"

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userRole, setUserRole] = useState(null)
  const [userName, setUserName] = useState("")
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (!userStr) { router.push("/"); return }
    const user = JSON.parse(userStr)
    setUserRole(user.role)
    setUserName(user.full_name || user.username)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const navigation = [
    { name: "Dashboard",  href: "/dashboard",  icon: LayoutDashboard, roles: ['admin', 'sales', 'inventory'] },
    { name: "Inventory",  href: "/inventory",  icon: Package,         roles: ['admin', 'sales', 'inventory'] },
    { name: "Customers",  href: "/customers",  icon: UserCircle,      roles: ['admin', 'sales'] },
    { name: "Sales",      href: "/sales",      icon: TrendingUp,      roles: ['admin', 'sales'] },
    { name: "Purchases",  href: "/purchases",  icon: ShoppingCart,    roles: ['admin', 'inventory'] },
    { name: "Transfer",   href: "/transfer",   icon: ArrowRightLeft,  roles: ['admin', 'inventory'] },
    { name: "Import",     href: "/import",     icon: Upload,          roles: ['admin'] },
    { name: "Reports",    href: "/reports",    icon: FileText,        roles: ['admin'] },
    { name: "Users",      href: "/users",      icon: Users,           roles: ['admin'] },
  ]

  const filteredNav = navigation.filter(item => userRole && item.roles.includes(userRole))

  const SidebarContent = ({ onLinkClick }) => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0 border-b border-white border-opacity-20">
        <Image src="/assests/fav.png" alt="Logo" width={36} height={36} className="rounded-lg flex-shrink-0" />
        <div className="min-w-0">
          <h1 className="text-white text-sm font-bold truncate">Inventory System</h1>
          <p className="text-blue-200 text-xs truncate">Servo Motors Pakistan</p>
        </div>
      </div>

      {/* User Badge */}
      <div className="mx-3 mt-3 px-3 py-2 bg-white bg-opacity-10 rounded-lg flex-shrink-0">
        <p className="text-blue-200 text-xs">Logged in as</p>
        <p className="text-white text-sm font-semibold truncate mt-0.5">{userName}</p>
        <span className={`inline-block text-xs font-bold uppercase mt-1 px-2 py-0.5 rounded-full ${
          userRole === 'admin' ? 'bg-red-500' : userRole === 'sales' ? 'bg-blue-500' : 'bg-green-600'
        } text-white`}>
          {userRole}
        </span>
      </div>

      {/* Nav Links - scrollable */}
      <nav className="flex-1 overflow-y-auto py-3 mt-1">
        {filteredNav.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onLinkClick}
              className={`flex items-center px-3 py-2.5 mx-2 mb-0.5 rounded-lg text-sm transition-all ${
                isActive
                  ? "bg-white bg-opacity-20 text-white font-semibold"
                  : "text-blue-100 hover:bg-white hover:bg-opacity-10 hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 mr-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-blue-300'}`} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="flex-shrink-0 border-t border-white border-opacity-20 p-3">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2.5 text-sm text-blue-100 hover:bg-white hover:bg-opacity-10 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 mr-3 flex-shrink-0" /> Logout
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── MOBILE OVERLAY ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black bg-opacity-60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 gradient-bg flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white border-opacity-20 flex-shrink-0 lg:hidden">
              <span className="text-white font-bold text-sm">Menu</span>
              <button onClick={() => setSidebarOpen(false)} className="text-white p-1 rounded hover:bg-white hover:bg-opacity-10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <SidebarContent onLinkClick={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 gradient-bg z-30 shadow-xl">
        <SidebarContent onLinkClick={() => {}} />
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm flex-shrink-0">
          <div className="flex items-center h-14 px-4 gap-3">
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1" />
            <p className="text-sm text-gray-500 hidden sm:block">
              Welcome, <span className="font-semibold text-gray-800">{userName}</span>
            </p>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
