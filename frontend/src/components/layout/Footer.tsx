import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerNavigation = {
    company: [
      { name: "About", href: "/about" },
      { name: "Contact us", href: "/contact" },
    ],
    legal: [
      { name: "Privacy policy", href: "/legal/privacy" },
      { name: "Terms of service", href: "/legal/terms" },
    ],
    social: [
      {
        name: "Email",
        href: "mailto:admin@example.com",
        icon: (
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
            <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
          </svg>
        ),
      },
    ],
  };

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Brand and company links */}
          <div className="space-y-4">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Mindful AI Sandbox
            </Link>
            <ul className="space-y-3">
              {footerNavigation.company.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-base text-gray-500 transition-colors hover:text-gray-900"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex space-x-6">
              {footerNavigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-400 transition-colors hover:text-gray-500"
                >
                  <span className="sr-only">{item.name}</span>
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Placeholder for student additions */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              Resources
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link
                  href="/admin"
                  className="text-base text-gray-500 transition-colors hover:text-gray-900"
                >
                  Admin dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900">
              Legal
            </h3>
            <ul className="mt-4 space-y-3">
              {footerNavigation.legal.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-base text-gray-500 transition-colors hover:text-gray-900"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-gray-200 pt-8">
          <p className="text-center text-base text-gray-400">
            &copy; {currentYear} Mindful AI Sandbox. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
