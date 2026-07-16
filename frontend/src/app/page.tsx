"use client";

import Link from "next/link";
import { useAuthContext } from "@/components/auth/AuthProvider";

export default function HomePage() {
  const { isAuthenticated } = useAuthContext();

  return (
    <main className="min-h-screen bg-gradient-to-b from-fiction-50/50 to-background">
      <div className="container mx-auto px-6 py-16">
        {/* Hero Section */}
        <section className="py-20 text-center" aria-labelledby="hero-heading">
          <div className="mx-auto max-w-4xl space-y-6">
            <h1
              id="hero-heading"
              className="text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
            >
              Welcome to your{" "}
              <span className="bg-gradient-to-r from-fiction-600 to-fiction-800 bg-clip-text text-transparent">
                Sandbox
              </span>
            </h1>

            <p className="mx-auto max-w-2xl text-lg text-foreground/80 md:text-xl">
              A full-stack web application template for the Mindful AI Coding
              course. Build, customize, and deploy your own project on AWS.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    className="inline-flex items-center justify-center rounded-full bg-fiction-600 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-fiction-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/admin"
                    className="inline-flex items-center justify-center rounded-full border border-fiction-600/30 bg-background px-8 py-4 text-base font-medium text-fiction-700 transition-colors hover:bg-fiction-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Admin
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center rounded-full bg-fiction-600 px-8 py-4 text-base font-medium text-white transition-colors hover:bg-fiction-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="inline-flex items-center justify-center rounded-full border border-fiction-600/30 bg-background px-8 py-4 text-base font-medium text-fiction-700 transition-colors hover:bg-fiction-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Quick Start Section */}
        <section className="py-12" aria-label="Quick start">
          <h2 className="sr-only">Quick Start</h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <div className="flex flex-col items-center rounded-xl border border-border/40 bg-card p-8 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-fiction-100">
                <svg
                  className="h-8 w-8 text-fiction-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Explore the Code</h3>
              <p className="text-foreground/70">
                A complete Next.js frontend and AWS Lambda backend, ready to
                customize.
              </p>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col items-center rounded-xl border border-border/40 bg-card p-8 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-fiction-100">
                <svg
                  className="h-8 w-8 text-fiction-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Customize & Build</h3>
              <p className="text-foreground/70">
                Add your own DynamoDB entities, API endpoints, and frontend
                pages.
              </p>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col items-center rounded-xl border border-border/40 bg-card p-8 text-center shadow-sm">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-fiction-100">
                <svg
                  className="h-8 w-8 text-fiction-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                  />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Deploy to AWS</h3>
              <p className="text-foreground/70">
                Use Terraform to provision your infrastructure and deploy with
                Amplify.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
