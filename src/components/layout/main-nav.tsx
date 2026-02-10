"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Building2, FileSpreadsheet, PieChart, Landmark, FileText, FolderOpen } from "lucide-react"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  const routes = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      href: "/properties",
      label: "Imóveis",
      icon: Building2,
      active: pathname.startsWith("/properties"),
    },
    {
      href: "/irpf-import",
      label: "Importar IRPF",
      icon: FileSpreadsheet,
      active: pathname.startsWith("/irpf-import"),
    },
    {
      href: "/holdings",
      label: "Participações",
      icon: PieChart,
      active: pathname.startsWith("/holdings"),
    },
    {
      href: "/financing",
      label: "Financiamentos",
      icon: Landmark,
      active: pathname.startsWith("/financing"),
    },
    {
      href: "/reports",
      label: "Relatórios",
      icon: FileText,
      active: pathname.startsWith("/reports"),
    },
    {
      href: "/documents",
      label: "Documentação",
      icon: FolderOpen,
      active: pathname.startsWith("/documents"),
    },
  ]

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6 overflow-x-auto pb-2 lg:pb-0", className)}
      {...props}
    >
      {routes.map((route) => (
        <Link
          key={route.href}
          href={route.href}
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary whitespace-nowrap",
            route.active
              ? "text-primary border-b-2 border-primary pb-1"
              : "text-muted-foreground pb-1 border-b-2 border-transparent"
          )}
        >
          <route.icon className="mr-2 h-4 w-4" />
          {route.label}
        </Link>
      ))}
    </nav>
  )
}
