import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  title: "Terms of Service | Mindful AI Sandbox",
  description:
    "Read the Terms of Service for Mindful AI Sandbox, the community-driven platform for serialized fiction.",
  alternates: {
    canonical: `${SITE_URL}/legal/terms`,
  },
  openGraph: {
    title: "Terms of Service | Mindful AI Sandbox",
    description:
      "Read the Terms of Service for Mindful AI Sandbox, the community-driven platform for serialized fiction.",
    type: "website",
    url: `${SITE_URL}/legal/terms`,
  },
  twitter: {
    card: "summary",
    title: "Terms of Service | Mindful AI Sandbox",
    description:
      "Read the Terms of Service for Mindful AI Sandbox, the community-driven platform for serialized fiction.",
  },
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-background">
      <div className="container mx-auto max-w-4xl px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900">
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600">
            <strong>Effective Date: November 6, 2025</strong>
          </p>
          <p className="mt-4 text-base text-gray-700">
            Welcome to example.com (&quot;Website&quot;, &quot;we&quot;,
            &quot;us&quot;, or &quot;our&quot;). These Terms of Service
            (&quot;Terms&quot;) govern your use of our website and services. By
            accessing or using example.com, you agree to be bound by these
            Terms.
          </p>
          <p className="mt-2 text-base font-semibold text-gray-900">
            Please read them carefully.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700">
              By accessing or using this Website, you confirm that you have
              read, understood, and agree to be bound by these Terms and our{" "}
              <Link
                href="/legal/privacy"
                className="text-blue-600 hover:text-blue-800"
              >
                Privacy Policy
              </Link>
              . If you do not agree, please do not use the Website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              2. Eligibility
            </h2>
            <p className="text-gray-700">
              You must be at least 13 years old to use this Website. If you are
              under 18, you represent that you have obtained permission from a
              parent or guardian.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              3. User Accounts
            </h2>
            <p className="mb-4 text-gray-700">
              Some features of the Website may require account registration.
            </p>
            <p className="mb-2 text-gray-700">You agree to:</p>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>Provide accurate and current information.</li>
              <li>Maintain the confidentiality of your account credentials.</li>
              <li>
                Notify us immediately of any unauthorized use of your account.
              </li>
            </ul>
            <p className="mt-4 text-gray-700">
              We reserve the right to terminate accounts that violate these
              Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              4. User Content
            </h2>
            <p className="mb-4 text-gray-700">
              By uploading, submitting, or posting any content to example.com,
              including but not limited to text, images, audio, video, or other
              media (&quot;User Content&quot;), you acknowledge and agree to the
              following:
            </p>
            <ul className="list-disc space-y-3 pl-6 text-gray-700">
              <li>
                <strong>Ownership:</strong> You retain all rights and ownership
                to your User Content. We do not claim ownership of your original
                creations.
              </li>
              <li>
                <strong>License to Use:</strong> By submitting User Content, you
                grant example.com a worldwide, non-exclusive, royalty-free,
                sublicensable, and transferable license to use, host, store,
                reproduce, publish, translate, distribute, publicly display and
                perform such content for the purpose of operating, promoting,
                and improving the Website and our services.
              </li>
              <li>
                <strong>Responsibility:</strong> You are solely responsible for
                the User Content you upload. You affirm that you have all
                necessary rights, licenses, and permissions to grant us the
                above license without violating the rights of any third party.
              </li>
              <li>
                <strong>Removal:</strong> You may remove your content at any
                time. However, the license granted to us continues for any use
                that occurred prior to removal.
              </li>
            </ul>
            <p className="mt-4 text-gray-700">
              You agree not to post any content that is unlawful, offensive,
              harmful, or violates the rights of others.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              5. Prohibited Activities
            </h2>
            <p className="mb-2 text-gray-700">You agree not to:</p>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>Use the Website for any illegal purpose.</li>
              <li>Interfere with or disrupt the Website or its servers.</li>
              <li>Attempt to access data or accounts without authorization.</li>
              <li>
                Use bots, scrapers, or other automated methods without our prior
                consent.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              6. Session Recording Consent
            </h2>
            <p className="mb-4 text-gray-700">
              By using our website and services, you acknowledge and agree that
              we may use session recording technologies to collect information
              about your interactions with our service. These technologies may
              capture mouse movements, clicks, scrolling, keystrokes, and other
              behavioral data to help us improve user experience and
              troubleshoot issues. By continuing to use our services after
              accepting our terms of service, you provide your consent to the
              recording of your session data as described in this agreement and
              our{" "}
              <Link
                href="/legal/privacy"
                className="text-blue-600 hover:text-blue-800"
              >
                Privacy Policy
              </Link>
              .
            </p>
            <p className="mb-4 text-gray-700">
              We take steps to protect sensitive information during session
              recording by masking or excluding personal data such as passwords,
              payment details, and other confidential information. For more
              information on our data practices and your rights, please consult
              our{" "}
              <Link
                href="/legal/privacy"
                className="text-blue-600 hover:text-blue-800"
              >
                Privacy Policy
              </Link>
              .
            </p>
            <p className="text-gray-700">
              If you do not consent to the use of session recording
              technologies, you may opt-out or discontinue use of our services.
              To opt-out, send a written request to{" "}
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
              7. Intellectual Property
            </h2>
            <p className="text-gray-700">
              All content on example.com, including text, graphics, logos, and
              software, is the property of example.com or its licensors and is
              protected by copyright and other intellectual property laws. You
              may not copy, modify, or distribute our content without our
              written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              8. Third-Party Links
            </h2>
            <p className="text-gray-700">
              Our Website may contain links to third-party websites. We are not
              responsible for the content, policies, or practices of any
              third-party websites or services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              9. Disclaimer of Warranties
            </h2>
            <p className="text-gray-700">
              The Website is provided &quot;as is&quot; and &quot;as
              available.&quot; We make no warranties, express or implied,
              regarding the reliability, availability, or accuracy of the
              Website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              10. Communications
            </h2>
            <p className="mb-4 text-gray-700">
              By creating an account on example.com, you acknowledge and agree
              that:
            </p>
            <ul className="list-disc space-y-2 pl-6 text-gray-700">
              <li>
                A valid email address is required for account registration and
                must be verified before your account is activated.
              </li>
              <li>
                You will receive transactional emails necessary for account
                operation, including email verification codes, password reset
                codes, and account security notifications.
              </li>
              <li>
                These transactional emails cannot be opted out of as they are
                essential for account security and functionality.
              </li>
            </ul>
            <p className="mt-4 text-gray-700">
              For more information about how we handle your email address and
              communications, please refer to our{" "}
              <Link
                href="/legal/privacy"
                className="text-blue-600 hover:text-blue-800"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              11. Limitation of Liability
            </h2>
            <p className="text-gray-700">
              To the fullest extent permitted by law, example.com shall not be
              liable for any indirect, incidental, or consequential damages
              resulting from your use or inability to use the Website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              12. Indemnification
            </h2>
            <p className="text-gray-700">
              You agree to indemnify and hold harmless example.com, its
              affiliates, and their officers, employees, and agents from any
              claims, liabilities, damages, and expenses arising out of your use
              of the Website or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              13. Changes to These Terms
            </h2>
            <p className="text-gray-700">
              We may update these Terms from time to time. The most current
              version will always be posted on this page with the effective
              date. Your continued use of the Website after any changes
              constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              14. Termination
            </h2>
            <p className="text-gray-700">
              We reserve the right to suspend or terminate your access to the
              Website at any time for any reason, including violation of these
              Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              15. Governing Law
            </h2>
            <p className="text-gray-700">
              These Terms are governed by the laws of California and the United
              States without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              16. Contact Us
            </h2>
            <p className="mb-2 text-gray-700">
              If you have any questions about these Terms, please contact us at:
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
              href="/legal/privacy"
              className="text-blue-600 hover:text-blue-800"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
