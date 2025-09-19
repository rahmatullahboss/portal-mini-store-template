'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  FileText,
  Settings,
  Tag,
  CreditCard,
  Bell,
  Mail,
  Image,
  File,
  UserCog,
  User,
  Layers,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin-dashboard',
    icon: BarChart3,
  },
  {
    title: 'Users',
    href: '/admin-dashboard/users',
    icon: Users,
  },
  {
    title: 'Products',
    href: '/admin-dashboard/products',
    icon: Package,
  },
  {
    title: 'Orders',
    href: '/admin-dashboard/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Categories',
    href: '/admin-dashboard/categories',
    icon: Layers,
  },
  {
    title: 'Reviews',
    href: '/admin-dashboard/reviews',
    icon: User,
  },
  {
    title: 'Coupons',
    href: '/admin-dashboard/coupons',
    icon: Tag,
  },
  {
    title: 'Reports',
    href: '/admin-dashboard/reports',
    icon: FileText,
  },
  {
    title: 'Marketing',
    href: '/admin-dashboard/marketing',
    icon: Mail,
  },
  {
    title: 'Content',
    href: '/admin-dashboard/content',
    icon: File,
  },
  {
    title: 'Media',
    href: '/admin-dashboard/media',
    icon: Image,
  },
  {
    title: 'Settings',
    href: '/admin-dashboard/settings',
    icon: Settings,
  },
]

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <div className="group has-[[data-collapsed=true]]:min-w-16">
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <TooltipProvider key={item.title}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                      pathname === item.href
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="group-[[data-collapsed=true]]:hidden">{item.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="group-[[data-collapsed=true]]:hidden">
                  {item.title}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </nav>
    </div>
  )
}
