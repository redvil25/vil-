import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Privacy Policy | Mindful AI Sandbox",
  description:
    "Read the Privacy Policy for Mindful AI Sandbox. Learn how we collect, use, and protect your personal information.",
  alternates: {
    canonical: `${SITE_URL}/legal/privacy`,
  },
  openGraph: {
    title: "Privacy Policy | Mindful AI Sandbox",
    description:
      "Read the Privacy Policy for Mindful AI Sandbox. Learn how we collect, use, and protect your personal information.",
    type: "website",
    url: `${SITE_URL}/legal/privacy`,
  },
  twitter: {
    card: "summary",
    title: "Privacy Policy | Mindful AI Sandbox",
    description:
      "Read the Privacy Policy for Mindful AI Sandbox. Learn how we collect, use, and protect your personal information.",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-background">
      <div className="container mx-auto max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600">
            <strong>Effective Date: February 26, 2026</strong>
          </p>
          <p className="mt-4 text-base text-gray-700">
            At example.com (&quot;we&quot;, &quot;our&quot;, or
            &quot;us&quot;), your privacy is important to us. This Privacy
            Policy explains how we collect, use, share, and protect your
            information when you use our website and services (the
            &quot;Website&quot;).
          </p>
          <p className="mt-2 text-base font-semibold text-gray-900">
            By using example.com, you agree to the terms of this Privacy
            Policy.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              1. Information We Collect
            </h2>
            <p className="mb-4 text-gray-700">
              We collect the following types of information:
            </p>

            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              a. Information You Provide
            </h3>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
              <li>
                <strong>Account Information:</strong> Username, email address,
                password
              </li>
              <li>
                <strong>User Content:</strong> Any text, media, or content you
                upload or submit to the site
              </li>
              <li>
                <strong>Communication:</strong> Messages or inquiries you send
                us
              </li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              b. Automatically Collected Information
            </h3>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>
                <strong>Usage Data:</strong> IP address, browser type, operating
                system, pages viewed, time spent on the site, referring URL
              </li>
              <li>
                <strong>Cookies and Tracking Technologies:</strong> We use
                cookies and similar technologies to enhance your experience and
                analyze usage.
              </li>
              <li>
                <strong>Session Data:</strong> Your session details such as
                items clicked, mouse movements, etc. are stored anonymously to
                help us improve the site.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              2. How We Use Your Information
            </h2>
            <p className="mb-2 text-gray-700">We use your information to:</p>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>Operate and improve the Website</li>
              <li>Provide customer support</li>
              <li>Personalize user experience</li>
              <li>
                Communicate with you (e.g., service messages, account
                notifications)
              </li>
              <li>Enforce our Terms of Service and policies</li>
              <li>Protect the security and integrity of our Website</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              3. Email Communications
            </h2>
            <p className="mb-4 text-gray-700">
              We use your email address to send you important communications
              related to your account. Here is what you can expect:
            </p>

            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              a. Transactional Emails (Required)
            </h3>
            <p className="mb-2 text-gray-700">
              These emails are necessary for account operation and security:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
              <li>
                <strong>Email Verification:</strong> A confirmation code sent
                when you register to verify your email address
              </li>
              <li>
                <strong>Password Reset:</strong> A code sent when you request to
                reset your password
              </li>
              <li>
                <strong>Account Security:</strong> Important notifications about
                your account security
              </li>
            </ul>
            <p className="mb-4 text-gray-700">
              <strong>
                By creating a Mindful AI Sandbox account, you explicitly consent to
                receive these transactional emails.
              </strong>{" "}
              These communications are essential for account functionality and
              security, and cannot be disabled while your account remains
              active.
            </p>

            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              b. Marketing Emails
            </h3>
            <p className="mb-4 text-gray-700">
              Mindful AI Sandbox currently sends only transactional emails required for
              account operation. We do not send marketing or promotional emails
              at this time. If we introduce marketing emails in the future, you
              will have the opportunity to opt-in or opt-out of receiving them.
            </p>

            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              c. Managing Your Preferences
            </h3>
            <p className="mb-4 text-gray-700">
              To manage your email preferences or if you have questions about
              emails you receive, please contact us at{" "}
              <a
                href="mailto:admin@example.com"
                className="text-blue-600 hover:text-blue-800"
              >
                admin@example.com
              </a>
              . Note that you cannot opt out of transactional emails as they are
              necessary for account security and operation.
            </p>

            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              d. Email Deliverability
            </h3>
            <p className="text-gray-700">
              To maintain the quality of our email communications, we monitor
              delivery status and handle undeliverable emails appropriately. If
              emails to your address repeatedly fail to deliver (bounce) or if
              you mark our emails as spam, we may remove your email address from
              our active mailing systems. This helps us maintain good email
              deliverability practices and comply with email service provider
              requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              4. How We Share Your Information
            </h2>
            <p className="mb-4 text-gray-700">
              We do not sell your personal information. We may share information
              in the following limited circumstances:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>
                <strong>Service Providers:</strong> With third-party vendors who
                help us operate the Website and deliver services
              </li>
              <li>
                <strong>Legal Obligations:</strong> If required by law or to
                protect our legal rights
              </li>
              <li>
                <strong>Business Transfers:</strong> In the event of a merger,
                acquisition, or sale of assets
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              5. Your Rights and Choices
            </h2>
            <p className="mb-4 text-gray-700">
              Depending on your location, you may have certain rights regarding
              your personal information, such as:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>Access to the data we hold about you</li>
              <li>Request correction or deletion of your data</li>
              <li>Object to or restrict certain data processing</li>
              <li>Withdraw consent (if processing is based on consent)</li>
            </ul>
            <p className="mt-4 text-gray-700">
              To exercise these rights, please contact us at{" "}
              <a
                href="mailto:admin@example.com"
                className="text-blue-600 hover:text-blue-800"
              >
                admin@example.com
              </a>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              6. Data Security
            </h2>
            <p className="text-gray-700">
              We take reasonable technical and organizational measures to
              protect your information from loss, misuse, or unauthorized
              access. However, no internet transmission is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              7. Children&apos;s Privacy
            </h2>
            <p className="text-gray-700">
              Our Website is not directed to children under 13. We do not
              knowingly collect personal information from anyone under 13. If we
              learn that we have, we will delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              8. Third-Party Links
            </h2>
            <p className="text-gray-700">
              Our Website may contain links to other websites. We are not
              responsible for the privacy practices of third-party sites. Please
              review their privacy policies separately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              9. Cookies and Consent
            </h2>
            <p className="mb-4 text-gray-700">
              We use cookies and similar technologies to understand how users
              interact with our Website and to deliver relevant advertising.
              Specifically:
            </p>
            <ul className="mb-4 list-disc space-y-2 pl-6 text-gray-700">
              <li>
                <strong>Analytics cookies:</strong> Google Analytics (GA4) helps
                us understand traffic patterns and how visitors use the Website.
              </li>
              <li>
                <strong>Advertising cookies:</strong> Google AdSense uses
                cookies to display relevant advertisements and measure ad
                performance.
              </li>
            </ul>

            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              Consent for EU/EEA/UK Visitors
            </h3>
            <p className="mb-4 text-gray-700">
              If you are visiting from the European Economic Area (EEA), the
              United Kingdom, or Switzerland, you will be presented with a
              consent banner before any advertising or analytics cookies are
              set. This banner is powered by Google&apos;s consent management
              platform, which is certified under the IAB Transparency and
              Consent Framework (TCF) v2.3.
            </p>
            <p className="mb-4 text-gray-700">
              You may accept or decline consent. If you decline, we will not set
              advertising cookies and will only collect basic, cookieless
              analytics data. You can change your consent preferences at any
              time using the &quot;Cookie Preferences&quot; link in the footer
              of every page.
            </p>

            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              Non-EU Visitors
            </h3>
            <p className="text-gray-700">
              If you are visiting from outside the EEA, UK, and Switzerland,
              cookies are enabled by default. You can control cookies through
              your browser settings at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              10. Advertising
            </h2>
            <p className="mb-4 text-gray-700">
              We use Google AdSense, a third-party advertising service provided
              by Google, to display advertisements on our Website. Google
              AdSense uses cookies, including the DoubleClick cookie, to serve
              ads based on your prior visits to this Website and other websites
              on the internet. This allows Google and its partners to show you
              ads that may be more relevant to your interests.
            </p>
            <p className="mb-4 text-gray-700">
              Third-party vendors, including Google, use cookies to serve ads
              based on your browsing activity. You may opt out of personalized
              advertising by visiting{" "}
              <a
                href="https://adssettings.google.com"
                className="text-blue-600 hover:text-blue-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Ads Settings
              </a>
              . You may also opt out of third-party vendor cookies for
              advertising by visiting the{" "}
              <a
                href="https://optout.networkadvertising.org"
                className="text-blue-600 hover:text-blue-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                Network Advertising Initiative opt-out page
              </a>
              .
            </p>
            <p className="text-gray-700">
              For more information about how Google collects and uses data when
              you use our Website, please visit{" "}
              <a
                href="https://policies.google.com/technologies/ads"
                className="text-blue-600 hover:text-blue-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                How Google uses information from sites or apps that use our
                services
              </a>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              11. Changes to This Privacy Policy
            </h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. The most
              recent version will always be posted on this page with the updated
              effective date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              12. Contact Us
            </h2>
            <p className="mb-2 text-gray-700">
              If you have any questions or concerns about this Privacy Policy,
              contact us at:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:admin@example.com"
                  className="text-blue-600 hover:text-blue-800"
                >
                  admin@example.com
                </a>
              </li>
              <li>
                <strong>Website:</strong>{" "}
                <a
                  href="http://localhost:3000"
                  className="text-blue-600 hover:text-blue-800"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  http://localhost:3000
                </a>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Back to Home
            </Link>
            <span className="text-gray-400">•</span>
            <Link
              href="/legal/terms"
              className="text-blue-600 hover:text-blue-800"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
