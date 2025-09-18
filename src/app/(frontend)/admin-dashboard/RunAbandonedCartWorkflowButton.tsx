'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Loader2, RotateCcw } from 'lucide-react'

interface RunAbandonedCartWorkflowButtonProps {
  ttlMinutes?: number
}

type StatusState =
  | { status: 'idle'; summary: null }
  | { status: 'running'; summary: null }
  | { status: 'success'; summary: string }
  | { status: 'error'; summary: string }

export function RunAbandonedCartWorkflowButton({ ttlMinutes }: RunAbandonedCartWorkflowButtonProps) {
  const [state, setState] = useState<StatusState>({ status: 'idle', summary: null })

  const handleRun = async () => {
    setState({ status: 'running', summary: null })

    const search = typeof ttlMinutes === 'number' ? `?ttlMinutes=${ttlMinutes}` : ''

    try {
      const response = await fetch(`/api/abandoned-carts/mark${search}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to run abandoned cart workflow')
      }

      const data = (await response.json()) as {
        marked?: number
        firstSent?: number
        secondSent?: number
        finalSent?: number
      }

      const marked = Number.isFinite(data.marked) ? Number(data.marked) : 0
      const firstSent = Number.isFinite(data.firstSent) ? Number(data.firstSent) : 0
      const secondSent = Number.isFinite(data.secondSent) ? Number(data.secondSent) : 0
      const finalSent = Number.isFinite(data.finalSent) ? Number(data.finalSent) : 0

      const reminders = firstSent + secondSent + finalSent
      const summary = `Flagged ${marked} cart${marked === 1 ? '' : 's'} and sent ${reminders} reminder${
        reminders === 1 ? '' : 's'
      }.`

      setState({ status: 'success', summary })
    } catch (error) {
      setState({ status: 'error', summary: error instanceof Error ? error.message : 'Unknown error' })
    }
  }

  const isRunning = state.status === 'running'

  return (
    <div className="flex flex-col items-start gap-2 text-sm">
      <Button onClick={handleRun} disabled={isRunning} size="sm" variant="outline" className="gap-2">
        {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
        Run Recovery Workflow
      </Button>
      {state.status === 'success' && state.summary && (
        <div className="flex items-start gap-2 text-green-600">
          <CheckCircle2 className="mt-[2px] h-4 w-4" />
          <span>{state.summary}</span>
        </div>
      )}
      {state.status === 'error' && state.summary && (
        <div className="flex items-start gap-2 text-red-600">
          <AlertCircle className="mt-[2px] h-4 w-4" />
          <span>{state.summary}</span>
        </div>
      )}
    </div>
  )
}

