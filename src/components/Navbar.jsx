'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Logo from './ui/Logo'
import { hybridStore } from '../lib/supabase/hybridStore'
import { User, LogOut, LayoutDashboard, Menu, X } from 'lucide-react'

export default function Navbar() {
  const [currentUser, setCurrentUser] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setCurrentUser(hybridStore.getCurrentUser())
    const unsubscribe = hybridStore.subscribe(null, (event) => {
      if (event.type === 'AUTH_CHANGED') {
        setCurrentUser(event.payload)
      }
    })
    return () => unsubscribe()
  }, [])

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand */}
        <Logo />

        {/* Desktop Nav Links matching Screen 1 */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 hover:text-brand-600 transition"
          >
            Home
          </Link>
          <a
            href="#features"
            className="text-sm font-medium text-slate-600 hover:text-brand-600 transition"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-slate-600 hover:text-brand-600 transition"
          >
            How It Works
          </a>
          <a
            href="#about"
            className="text-sm font-medium text-slate-600 hover:text-brand-600 transition"
          >
            About
          </a>
          <a
            href="#contact"
            className="text-sm font-medium text-slate-600 hover:text-brand-600 transition"
          >
            Contact
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <Link
                href={
                  currentUser.role === 'teacher'
                    ? '/teacher/dashboard'
                    : '/student/dashboard'
                }
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-xl transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <button
                onClick={() => {
                  hybridStore.logout()
                  setCurrentUser(null)
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-brand-600 rounded-xl transition"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-sm shadow-brand-500/25 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-100 bg-white px-4 pt-3 pb-6 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Home
          </Link>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            How It Works
          </a>
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl"
            >
              Log In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-sm font-semibold text-white bg-brand-500 rounded-xl shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
