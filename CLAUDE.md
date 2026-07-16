# CLAUDE.md

NOTE:  This is a sample repository provided to students for class purposes.  This repo may have defaults not appropriate for the student environment.

## Project Overview

Mindful AI Sandbox is a full-stack AWS serverless starter template designed for students learning cloud-native development. It ships with authentication, user profiles, and admin user management out of the box. The architecture pairs a Next.js frontend with an Express.js backend running on AWS Lambda.

## Tech Stack

- **Frontend**: Next.js 16 (React 19, TypeScript, Tailwind CSS)
- **Backend**: Express.js on AWS Lambda (Node.js), exposed via API Gateway
- **Database**: Amazon DynamoDB (single-table design)
- **Auth**: Amazon Cognito (JWT-based)
- **IaC**: Terraform
- **CI/CD**: GitHub Actions

## API Endpoints

### Authentication

- `POST /auth/register` - Create new account
- `POST /auth/login` - Authenticate user
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - Invalidate session
- `POST /auth/confirm-signup` - Confirm account with verification code
- `POST /auth/forgot-password` - Initiate password reset
- `POST /auth/confirm-forgot-password` - Complete password reset with code

### Profile

- `GET /me` - Get current user profile
- `PUT /me` - Update current user profile
- `GET /users/:userId` - Get a public user profile

### Admin

- `GET /admin/users` - List all users
- `PUT /admin/users/:id` - Update a user
- `DELETE /admin/users/:id` - Delete a user
- `POST /admin/users/:id/enable` - Enable a user account
- `POST /admin/users/:id/disable` - Disable a user account
- `POST /admin/users/:id/reset-password` - Reset a user's password

## Data Model (DynamoDB Single-Table)

| PK            | SK      | Key Attributes                              |
| ------------- | ------- | ------------------------------------------- |
| USER#{userId} | PROFILE | email, username, role, createdAt, updatedAt |

**Roles**: User, Admin

## Code Quality Rules

- TypeScript strict mode enabled in both frontend and backend
- ESLint + Prettier enforce consistent formatting
- Husky pre-commit hooks run linting and type checks automatically
- No code push or commit is successful if pre-commit hooks fail -- always report failures and suggest fixes
- Never use emojis in commit messages, code, or communication

## Sensitive Files -- Do Not Read

The following files contain secrets and must never be read, displayed, or logged:

- `infrastructure/environments/staging/.env` -- GitHub access tokens, OAuth secrets
- `infrastructure/environments/staging/terraform.tfvars` -- may contain secrets
- `~/.aws/credentials` -- AWS access keys

When helping with Terraform, refer to `.env.example` and `terraform.tfvars.example` for variable names and structure. Never read the actual `.env` or `terraform.tfvars` files.  Note that there is a scripts/DeployStage.py script to ensure that secrets are imported correctly before Terraform is run.

## Local Development

When running locally, always use the existing script:

scripts/RunLocal.py



<!-- Students: document your own entities here as you extend the template.
     For example, if you add a "Post" or "Product" entity, describe its
     PK/SK pattern, attributes, and any GSIs you create. -->
