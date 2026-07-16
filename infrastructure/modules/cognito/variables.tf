# Cognito Module Variables

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
}

variable "callback_urls" {
  description = "List of allowed callback URLs for OAuth"
  type        = list(string)
  default = [
    "http://localhost:3000/auth/callback",
    "https://localhost:3000/auth/callback",
    "https://your-app.amplifyapp.com/auth/callback"
  ]
}

variable "logout_urls" {
  description = "List of allowed logout URLs"
  type        = list(string)
  default = [
    "http://localhost:3000",
    "https://localhost:3000",
    "https://your-app.amplifyapp.com"
  ]
}

variable "ses_email_arn" {
  description = "ARN of SES verified email identity for sending emails"
  type        = string
  default     = ""
}

variable "from_email_address" {
  description = "Email address to send verification emails from"
  type        = string
  default     = "noreply@example.com"
}

variable "reply_to_email_address" {
  description = "Reply-to email address for verification emails"
  type        = string
  default     = ""
}

# Google OAuth Configuration
variable "google_client_id" {
  description = "Google OAuth Client ID for social login"
  type        = string
  default     = ""
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret for social login"
  type        = string
  default     = ""
  sensitive   = true
}

# Lambda Triggers
variable "pre_signup_lambda_arn" {
  description = "ARN of the Pre Sign-up Lambda trigger for auto-confirming federated users"
  type        = string
  default     = ""
}
