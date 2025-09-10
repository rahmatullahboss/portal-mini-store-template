import React from 'react'
import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200/60 bg-gray-50/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">© {new Date().getFullYear()} Online Bazar</p>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-sm">
            <a href="tel:01739416661" className="text-gray-700 hover:text-amber-600">Mobile: 01739416661</a>
            <a
              href="mailto:rahmatullahzisan@gmail.com"
              className="text-gray-700 hover:text-amber-600"
            >
              Email: rahmatullahzisan@gmail.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

