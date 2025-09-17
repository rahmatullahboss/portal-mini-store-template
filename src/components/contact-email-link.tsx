'use client'

import { useMemo } from 'react'

import { cn } from '@/lib/utils'

type ContactEmailLinkProps = {
  className?: string
  label?: string
}

const EMAIL_PARTS = ['rahmatullahzisan', 'gmail', 'com'] as const

export function ContactEmailLink({ className, label }: ContactEmailLinkProps) {
  const email = useMemo(() => {
    const [user, domain, tld] = EMAIL_PARTS
    return `${user}@${domain}.${tld}`
  }, [])

  const href = useMemo(() => `mailto:${email}`, [email])

  return (
    <a
      href={href}
      className={cn(
        'transition-colors hover:text-emerald-600 focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-50',
        className,
      )}
      aria-label={`Email Online Bazar at ${email}`}
    >
      {label ?? email}
    </a>
  )
}

export default ContactEmailLink
