import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  // Redirect to the new dashboard page
  redirect('/admin-dashboard/dashboard')
}
