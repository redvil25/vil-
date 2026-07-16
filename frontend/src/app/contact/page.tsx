import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Mindful AI Sandbox team.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-background">
      <div className="container mx-auto max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
            Contact Us
          </h1>
          <p className="text-lg text-gray-600">
            Have a question, suggestion, or just want to say hello? We would
            love to hear from you.
          </p>
        </div>

        {/* Contact Info */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Get in Touch
            </h2>
            <p className="mb-6 text-gray-700">
              The best way to reach us is by email. Whether you have a question
              about the platform, need technical support, or want to share
              feedback, we read every message and aim to respond within two
              business days.
            </p>
            <a
              href="mailto:admin@example.com"
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-blue-700"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
                <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
              </svg>
              admin@example.com
            </a>
          </section>

          {/* FAQ Section */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  What is the Mindful AI Sandbox?
                </h3>
                <p className="text-gray-700">
                  The Mindful AI Sandbox is a full-stack web application
                  template built for the Mindful AI Coding course. It provides a
                  production-ready foundation with authentication, user
                  management, and infrastructure-as-code that you can extend
                  with your own features.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  How do I get started?
                </h3>
                <p className="text-gray-700">
                  Check out the{" "}
                  <Link href="/" className="text-blue-600 hover:text-blue-800">
                    home page
                  </Link>{" "}
                  for quick start instructions, or refer to the README in the
                  repository for detailed setup steps.
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  I found a bug or have a feature request. Where should I report
                  it?
                </h3>
                <p className="text-gray-700">
                  Send us an email at{" "}
                  <a
                    href="mailto:admin@example.com"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    admin@example.com
                  </a>{" "}
                  with a description of the issue or your idea. We appreciate
                  all feedback.
                </p>
              </div>
            </div>
          </section>

          {/* Response Expectations */}
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              What to Expect
            </h2>
            <p className="text-gray-700">
              We are a small team and we value every message. You can expect a
              personal response within two business days. For urgent matters,
              please include &quot;Urgent&quot; in your email subject line and
              we will do our best to respond sooner.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Back to Home
            </Link>
            <span className="text-gray-400">&bull;</span>
            <Link href="/about" className="text-blue-600 hover:text-blue-800">
              About
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
