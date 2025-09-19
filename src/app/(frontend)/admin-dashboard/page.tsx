import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import config from '@/payload.config'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SiteHeader } from '@/components/site-header'
import { OrderStatusUpdate } from '@/components/lazy-client-components'
import { DateFilter } from './DateFilter'
import SalesReport from './sales-report'
import {
  ArrowLeft,
  Clock,
  Loader2,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShoppingCart,
  BarChart3,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  // Redirect to the new dashboard page
  redirect('/admin-dashboard/dashboard')
}
