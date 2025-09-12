import React from 'react'
import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200/60 bg-gray-50/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <Link href="/" className="text-2xl font-semibold text-emerald-700">
              gocart<span className="text-emerald-500">.</span>
            </Link>
            <p className="text-sm text-gray-600 mt-3 max-w-xs">
              Your destination for the latest gadgets and daily essentials — all in one place.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 tracking-wide">Products</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li><Link href="/" className="hover:text-emerald-600">Earphones</Link></li>
              <li><Link href="/" className="hover:text-emerald-600">Headphones</Link></li>
              <li><Link href="/" className="hover:text-emerald-600">Smartphones</Link></li>
              <li><Link href="/" className="hover:text-emerald-600">Laptops</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 tracking-wide">Website</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li><Link href="/" className="hover:text-emerald-600">Home</Link></li>
              <li><Link href="/privacy" className="hover:text-emerald-600">Privacy Policy</Link></li>
              <li><Link href="/" className="hover:text-emerald-600">Become Plus Member</Link></li>
              <li><Link href="/" className="hover:text-emerald-600">Create Your Store</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 tracking-wide">Contact</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-600">
              <li>Phone: <a href="tel:01739416661" className="hover:text-emerald-600">+88 01739-416661</a></li>
              <li>Email: <a href="mailto:contact@example.com" className="hover:text-emerald-600">contact@example.com</a></li>
              <li>Address: 794 Francisco, 94102</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600">Copyright {new Date().getFullYear()} © gocart — All rights reserved.</p>
          <div className="flex items-center gap-5 text-sm">
            <a href="#" className="text-gray-600 hover:text-emerald-600">Facebook</a>
            <a href="#" className="text-gray-600 hover:text-emerald-600">Instagram</a>
            <a href="#" className="text-gray-600 hover:text-emerald-600">Twitter</a>
            <a href="#" className="text-gray-600 hover:text-emerald-600">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

