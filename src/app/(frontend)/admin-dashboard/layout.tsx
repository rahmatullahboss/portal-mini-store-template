import { SidebarNav } from '@/components/admin/sidebar-nav'
import { SiteHeader } from '@/components/site-header'
import { getPayload } from 'payload'
import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { User } from '@/payload-types'

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  // Redirect to login if not authenticated or not admin
  if (!user || (user as User).role !== 'admin') {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <SiteHeader variant="full" user={user} />
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-40">
          <div className="border-r bg-background">
            <div className="flex h-full max-h-screen flex-col gap-2">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <h2 className="text-lg font-semibold">Admin Panel</h2>
              </div>
              <div className="flex-1 overflow-auto py-2">
                <SidebarNav />
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar */}
        <div className="md:hidden fixed top-14 left-0 right-0 z-30 bg-background border-b p-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                  <h2 className="text-lg font-semibold">Admin Panel</h2>
                </div>
                <div className="flex-1 overflow-auto py-2">
                  <SidebarNav />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col md:ml-64 pt-14 md:pt-0">
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
