import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about the Mindful AI Sandbox, a full-stack web application template.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-4xl font-bold text-gray-900">
        About Mindful AI Sandbox
      </h1>

      <div className="prose prose-lg max-w-none">
        <p className="text-xl text-gray-600">
          The Mindful AI Sandbox is a full-stack web application template built
          for the Mindful AI Coding course. It provides a production-ready
          foundation with authentication, user management, and
          infrastructure-as-code that students can extend with their own
          features.
        </p>

        <h2 className="mt-12 text-2xl font-bold text-gray-900">
          Technology Stack
        </h2>
        <ul className="mt-4 space-y-2 text-gray-600">
          <li>
            <strong>Frontend:</strong> Next.js with React, TypeScript, and
            Tailwind CSS
          </li>
          <li>
            <strong>Backend:</strong> AWS Lambda with Node.js, exposed via API
            Gateway
          </li>
          <li>
            <strong>Database:</strong> Amazon DynamoDB (single-table design)
          </li>
          <li>
            <strong>Authentication:</strong> Amazon Cognito with JWT tokens
          </li>
          <li>
            <strong>Infrastructure:</strong> Terraform for AWS resource
            provisioning
          </li>
          <li>
            <strong>Hosting:</strong> AWS Amplify for frontend, API Gateway for
            backend
          </li>
        </ul>

        <h2 className="mt-12 text-2xl font-bold text-gray-900">
          Getting Started
        </h2>
        <p className="mt-4 text-gray-600">
          Check out the{" "}
          <Link href="/" className="text-blue-600 hover:text-blue-500">
            home page
          </Link>{" "}
          to get started, or visit the README in the repository for detailed
          setup instructions.
        </p>
      </div>
    </div>
  );
}
