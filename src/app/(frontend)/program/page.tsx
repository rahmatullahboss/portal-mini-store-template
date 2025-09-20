import React from 'react'
import { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers.js'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { SiteHeader } from '@/components/site-header'
import { ProgramRegistrationForm } from '@/components/program-registration-form'

export const metadata: Metadata = {
  title: 'Special Program for School Students | Online Bazar',
  description:
    'A special program for Calix and Sunbeam school students with educational activities and competitions.',
}

export default async function ProgramPage() {
  const headers = await getHeaders()
  const payload = await getPayload({ config: configPromise })

  // Get user for header
  const authResult = await payload.auth({ headers })
  const user = authResult?.user ?? null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-stone-100 text-gray-800">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 motion-safe:animate-pulse motion-reduce:animate-none motion-reduce:filter-none motion-reduce:mix-blend-normal motion-reduce:bg-[radial-gradient(circle_at_center,_rgba(251,191,36,0.35),_transparent_65%)] motion-reduce:opacity-25"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 motion-safe:animate-pulse motion-reduce:animate-none motion-reduce:filter-none motion-reduce:mix-blend-normal motion-reduce:bg-[radial-gradient(circle_at_center,_rgba(244,114,182,0.3),_transparent_60%)] motion-reduce:opacity-25 animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 motion-safe:animate-pulse motion-reduce:animate-none motion-reduce:filter-none motion-reduce:mix-blend-normal motion-reduce:bg-[radial-gradient(circle_at_center,_rgba(147,197,253,0.25),_transparent_60%)] motion-reduce:opacity-20 animation-delay-4000"></div>
      </div>

      <div className="relative z-20">
        <SiteHeader variant="full" user={user} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 pt-20 pb-20">
        <article className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 text-center brand-text">
            ক্যালিক্স ও সানবীম স্কুলের শিক্ষার্থীদের জন্য এক বিশেষ আয়োজন
          </h1>

          <div className="prose max-w-none mb-8 bg-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Description</h2>
            <p className="mb-4">প্রিয় ক্যালিক্স ও সানবীম স্কুলের বন্ধুরা,</p>

            <p className="mb-4">
              তোমাদের জন্য আমরা নিয়ে এসেছি এক অসাধারণ আয়োজন! পড়াশোনার পাশাপাশি নতুন কিছু শেখা,
              বন্ধুদের সাথে মজার সব অ্যাক্টিভিটি করা এবং নিজের প্রতিভাকে সবার সামনে তুলে ধরার একটি
              দারুণ সুযোগ থাকছে এই প্রোগ্রামে।
            </p>

            <p className="mb-4">আমাদের এই বিশেষ আয়োজনে তোমাদের জন্য থাকছে:</p>

            <ul className="list-disc pl-6 mb-4">
              <li className="mb-2">মজার মজার শিক্ষামূলক কুইজ ও প্রতিযোগিতা।</li>
              <li className="mb-2">বিজ্ঞান ও প্রযুক্তির উপর ক্রিয়েটিভ ওয়ার্কশপ।</li>
              <li className="mb-2">ছবি আঁকা এবং বিভিন্ন সৃজনশীল কাজের সুযোগ।</li>
              <li>নতুন বন্ধুদের সাথে পরিচিত হওয়ার এবং দলবদ্ধ হয়ে কাজ করার সুযোগ।</li>
            </ul>

            <p className="mb-6">
              স্কুলের চার দেয়ালের বাইরে নতুন কিছু অভিজ্ঞতা অর্জন করতে এবং একটি अবিস্মরণীয় দিন
              কাটাতে চাইলে আর দেরি কেন? আজই নিচের ফর্মটি পূরণ করে আমাদের সাথে যোগ দাও &quot;জ্ঞানের
              উৎসবে&quot;।
            </p>

            <h3 className="text-xl font-bold mb-4">
              প্রোগ্রামে অংশগ্রহণ করতে নিচের ফর্মটি সঠিকভাবে পূরণ করো।
            </h3>

            <ProgramRegistrationForm />
          </div>
        </article>
      </div>
    </div>
  )
}
