# Lab 2: Deploy to AWS via Terraform

This lab walks you through deploying the Mindful AI Sandbox infrastructure to your own AWS account. It covers everything from creating your AWS account to using Terraform to provision AWS infrastructure. At the end of this lab, you will have a running app in AWS.

---

## Prerequisites

Complete the Setup Guide first so your local development environment is working.   You can find the setup guide in the lab one section of the Maven course or in the Docs directory of the sandbox repo.

## Set up AWS

Set up AWS services in order to deploy the Mindful AI Sandbox infrastructure to AWS.

### Create an AWS Account

If you do not already have an AWS account, create one at [aws.amazon.com/free](https://aws.amazon.com/free). The free tier covers most resources used in this project.  Note that you will need an AWS account to complete this lab.  You can use your root user account for the purpose of this account, but you will need to set up an IAM user for Terraform if you want to put this into production.  See the Terraform [best practices guide](https://www.hashicorp.com/en/blog/terraform-security-5-foundational-practices) for more information.  

### Install the AWS CLI v2

The AWS CLI is used to interact with AWS services from the command line.

- **Windows**: Download and run the installer from [aws.amazon.com/cli](https://aws.amazon.com/cli/).  
- **macOS**: If you have Homebrew, run the `brew install awscli` command or download from [aws.amazon.com/cli](https://aws.amazon.com/cli/).  
- **Linux**: Follow the AWS CLI installation guide at [docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html](http://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)..

### Configure your credentials

1. Type the following at the command prompt:

```shell
aws login
```

2. When prompted for the AWS Region, type or select `us-west-2`.  
3. AWS opens a browser window. Follow the instructions to log in.  
4. Verify the installation:

```shell
aws --version          # should show aws-cli/2.x.x
aws sts get-caller-identity   # should return your account/user info
```

## Install and Configure Terraform v1.15+

You need to install and configure Terraform version 1.15. Some of the configuration work can be done by Claude if you choose.

### Install Terraform 1.15+

Terraform provisions all AWS infrastructure including DynamoDB, Cognito, Lambda, API Gateway, and Amplify.

- **Windows**: Download from [terraform.io/downloads](https://developer.hashicorp.com/terraform/downloads). Extract the binary and add it to your system PATH.   
- **macOS**: Run `brew install terraform`  
- **Linux**: Follow the Terraform installation guide at [https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli). 

Verify the installation:

```shell
terraform --version    # should show v1.5.x or higher
```

### Checklist

Before continuing, confirm each of the following:

| Requirement                           | How to Check                                            |
|:------------------------------------- |:------------------------------------------------------- |
| AWS account created                   | Log in to the AWS Console                               |
| AWS CLI v2 installed                  | `aws --version` prints `aws-cli/2.x.x`                  |
| AWS credentials configured            | `aws sts get-caller-identity` returns your account info |
| Terraform 1.15+ installed             | `terraform --version` prints `v1.15.x` or higher        |
| Local development environment working | `python scripts/RunLocal.py` starts both servers        |

---

### Use Claude AI to complete deployment

You can useClaude to complete the majority of this work for you.  The remaining sections of the lab describe the steps you need to do if you want to configure Terraform manually and we will ask Claude to complete these steps for you.

To instruct Claude to perform the work,, run `claude` at the command line to open the Claude Code console. Copy and paste the following prompt: 

Open "docs\\Terraform Configuration.md" and follow the instructions there, starting with step 1 and continuing through step 5\.  Do not complete steps 6 or 7\.  All prerequisites are already done.  Note that I will need to manually provide secrets a few times.  Let me know when you're ready for that and I'll do that work manually.   Update the MD file with your progress as you work.

You will see Claude working on the request. If Claude prompts you for information, provide the requested information. You can accept the defaults. If you don’t understand what Claude is doing, ask Claude questions in order to clarify.  It is normal for Claude to have a few fits and starts, so allow Claude to solve the problems it finds.  If you have any questions or concerns, reach out to your instructor.

**NOTE:** Both steps 6 and 7 are optional.  These steps will be discussed during class.  

### Step 1: Create Your State Backend

Terraform needs an S3 bucket and DynamoDB table to store state remotely. Run these commands once (replace `YOUR_UNIQUE_BUCKET_NAME` with a globally unique name):

```shell
# Create the S3 state bucket
aws s3api create-bucket \
  --bucket YOUR_UNIQUE_BUCKET_NAME \
  --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2

# Enable versioning (protects against accidental state deletion)
aws s3api put-bucket-versioning \
  --bucket YOUR_UNIQUE_BUCKET_NAME \
  --versioning-configuration Status=Enabled

# Enable server-side encryption
aws s3api put-bucket-encryption \
  --bucket YOUR_UNIQUE_BUCKET_NAME \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"aws:kms"}}]}'

# Block all public access
aws s3api put-public-access-block \
  --bucket YOUR_UNIQUE_BUCKET_NAME \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# Create the DynamoDB lock table
aws dynamodb create-table \
  --table-name YOUR_UNIQUE_BUCKET_NAME-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-west-2
```

Then update both `backend.tf` files with your bucket and table names:

| File                                             | Key                         |
|:------------------------------------------------ |:--------------------------- |
| `infrastructure/backend.tf`                      | `terraform.tfstate` (root)  |
| `infrastructure/environments/staging/backend.tf` | `staging/terraform.tfstate` |

In each file, replace:

- `your-terraform-state-bucket` with your bucket name  
- `your-terraform-locks-table` with your DynamoDB table name

These values cannot use Terraform variables \-- they must be hardcoded strings because Terraform reads them before processing any other configuration.

### Step 2: Create a GitHub Personal Access Token

Terraform provisions an AWS Amplify app that connects to your GitHub repository. Amplify uses a personal access token (PAT) to read your repo and deploy the frontend.

1. Go to [GitHub Settings \> Tokens](https://github.com/settings/tokens) (classic tokens).  
2. Select **Generate new token (classic).**  
3. Give it a descriptive name (for example, `amplify-sandbox`).  
4. Select the **`repo`** scope (Full control of private repositories).  
5. Click **Generate token** and copy the value \-- you will not see it again.

You will paste this token into your `.env` file in Step 3\.

**Security note:** This token is stored in your local `.env` (git-ignored) and passed to Terraform via environment variable. It is never committed to the repository. Do not paste secrets into `terraform.tfvars` or share them with AI assistants.

### Step 3: Configure Your Variables

There are two configuration files: one for secrets, one for everything else.

#### Secrets (`.env`)

```shell
cd infrastructure/environments/staging
cp .env.example .env
```

Open `.env` and paste your GitHub access token from Step 1b.

**Important:** Never put secrets in `terraform.tfvars`. The `.env` file keeps them as environment variables so they are not written to any file that tools might read.

#### Project settings (`terraform.tfvars`)

```shell
cp terraform.tfvars.example terraform.tfvars
```

Open `terraform.tfvars` and fill in your values. Both files are git-ignored so nothing leaves your machine.

### Variable Reference

| Variable                 | Where    | Required? | Description                                             |
|:------------------------ |:-------- |:--------- |:------------------------------------------------------- |
| `github_access_token`    | `.env`   | Yes       | GitHub PAT for Amplify (see Step 2\)                    |
| `project_name`           | `tfvars` | Yes       | Prefix for all AWS resource names (e.g., `my-sandbox`)  |
| `aws_region`             | `tfvars` | Yes       | AWS region to deploy into (default: `us-west-2`)        |
| `github_repository`      | `tfvars` | Yes       | Your GitHub repo in `owner/repo` format                 |
| `alarm_email`            | `tfvars` | Yes       | Email for CloudWatch alarm notifications                |
| `from_email_address`     | `tfvars` | No        | Cognito sender email (default: `noreply@example.com`)   |
| `reply_to_email_address` | `tfvars` | No        | Cognito reply-to email (default: `support@example.com`) |
| `common_tags`            | `tfvars` | No        | Tags applied to all resources                           |

### Step 4: Configure AWS and Deploy the App

Now that we have the basics configured, we will use Terraform to configure the infrastructure we need within AWS to host our application.  We will also deploy the application via script onto this provisioned infrastructure.  Note that because we are using Terraform, this infrastructure is completely controlled by code.  Direct user intervention using AWS console or CLI should be minimal.  

#### Deploy using the script (recommended)

From the repository root, run:

```shell
python scripts/DeployStage.py TerraformOnly
```

The `TerraformOnly` flag deploys just the infrastructure without triggering an Amplify frontend build. This is what you want for the initial setup \-- you need to configure your application environment files (Step 5\) before deploying the frontend.

The script loads your `.env` secrets automatically, then runs `terraform init`, `terraform plan`, and `terraform apply`. Terraform will prompt you to type `yes` before creating resources.

#### Deploy manually

If you prefer to run the commands yourself, type the following:

```shell
cd infrastructure/environments/staging

# Load your secrets into the shell
source .env

# Initialize Terraform (downloads providers, configures backend)
terraform init

# Preview what will be created
terraform plan

# Deploy (type 'yes' when prompted)
terraform apply
```

**Reminder:** If running manually, you must run `source .env` in every new terminal session before running Terraform commands. Without it, Terraform will not have your GitHub access token and the Amplify app will fail to create.

After a successful `apply`, Terraform prints output values you will need in the next step.

**Important:** Always run Terraform from `infrastructure/environments/staging/`, not from the `infrastructure/` root directory. They use separate state files.

### Step 5: Connect Your Application

After deploying, map Terraform outputs to your application environment files.

View all outputs:

```shell
terraform output
```

#### Backend (`backend/.env`)

```shell
AUTH_MODE=cognito
AWS_REGION=us-west-2
DYNAMODB_TABLE_NAME=<dynamodb_table_name>
COGNITO_USER_POOL_ID=<cognito_user_pool_id>
COGNITO_CLIENT_ID=<cognito_web_client_id>
ALLOWED_ORIGINS=http://localhost:3000
```

#### Frontend (`frontend/.env.local`)

```shell
NEXT_PUBLIC_API_URL=<api_gateway_invoke_url>
NEXT_PUBLIC_COGNITO_USER_POOL_ID=<cognito_user_pool_id>
NEXT_PUBLIC_COGNITO_CLIENT_ID=<cognito_web_client_id>
NEXT_PUBLIC_COGNITO_DOMAIN=<cognito_domain>
NEXT_PUBLIC_COGNITO_REGION=us-west-2
```

Sensitive outputs (like `cognito_web_client_id`) require the `-json` flag: `terraform output -json cognito_web_client_id`

Once your environment files are configured, run a full deploy from the repository root:

```shell
python scripts/DeployStage.py
```

This re-runs Terraform (to pick up any changes) and then triggers an Amplify frontend build. Terraform will show "No changes" if infrastructure is already up to date.

### Step 6: Deploy the Frontend to Amplify (Optional)

Terraform creates the Amplify app and connects it to your GitHub repository, but **auto-build is disabled** which means pushing to `main` will not trigger a deployment. You must trigger builds explicitly using one of the methods in this section.  Your running staging environment will not pick up any changes you make without this step.  Your staging site should already be fully up and running after you run the `DeployStage.py` script in step 5\.

Amplify builds the frontend on its servers using the `amplify.yml` build spec at the repository root. You do not need to build locally.

If you already ran `python scripts/DeployStage.py` after Step 5, your frontend is already deployed**.** The methods below are only needed if you want to redeploy the frontend independently.

#### Option A: Deploy using the script (recommended)

From the repository root, run:

```shell
python scripts/DeployStage.py
```

The script loads your `.env` secrets, runs Terraform, then triggers an Amplify build and polls until it completes.

#### Option B: Deploy using the AWS CLI

Get your Amplify app ID from the Terraform outputs:

```shell
cd infrastructure/environments/staging
terraform output amplify_app_id
```

Trigger a build (Amplify pulls the latest code from your `main` branch and builds it):

```shell
aws amplify start-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-type RELEASE
```

Check the build status:

```shell
aws amplify list-jobs \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --max-results 1
```

#### Option C: Deploy via the Amplify Console

1. Open the [AWS Amplify Console](https://console.aws.amazon.com/amplify/).  
2. Select your app (named `<project_name>-staging`).  
3. Click the **main** branch.  
4. Click **Redeploy this version.**

#### Check for a successful deployment

After a successful deployment, your frontend is live at the URL shown in the Terraform outputs:

```shell
terraform output amplify_app_url
```

This is typically `https://main.<app-id>.amplifyapp.com`. Cognito callback URLs and CORS are already configured to allow this domain.

### Step 7: Switch to Cognito Auth Locally (Optional)

After deploying infrastructure, you can switch your local development environment from mock auth to real AWS Cognito authentication. This lets you test the app with different users on your local instance. If you don’t plan to do this, you do not need to perform this task.

1. Copy `.env.example` to `.env` in the backend directory (instead of `.env.local.example`):

```shell
cd backend
cp .env.example .env
```

2. Fill in the values from your Terraform outputs:

```shell
AUTH_MODE=cognito
AWS_REGION=us-west-2
DYNAMODB_TABLE_NAME=<dynamodb_table_name>
COGNITO_USER_POOL_ID=<cognito_user_pool_id>
COGNITO_CLIENT_ID=<cognito_web_client_id>
ALLOWED_ORIGINS=http://localhost:3000
```

3. Restart the backend server.

Test accounts from mock auth will no longer work. You will need to register new accounts through the signup page or create users in the Cognito console.

To switch back to mock auth, rename or delete `backend/.env` and restart the server. The launcher script will recreate the mock auth `.env.local` automatically.

## You now have a working app in AWS

After successfully following the steps in this lab, you will have a working deployment of the Mindful AI Sandbox app on AWS. Check the URL that Claude gives you or ask Claude what your URL is.



---

## Quick Reference

| Terraform Output          | Backend `.env` Variable | Frontend `.env.local` Variable                       |
|:------------------------- |:----------------------- |:---------------------------------------------------- |
| `cognito_user_pool_id`    | `COGNITO_USER_POOL_ID`  | `NEXT_PUBLIC_COGNITO_USER_POOL_ID`                   |
| `cognito_web_client_id`   | `COGNITO_CLIENT_ID`     | `NEXT_PUBLIC_COGNITO_CLIENT_ID`                      |
| `cognito_domain`          | \--                     | `NEXT_PUBLIC_COGNITO_DOMAIN`                         |
| `dynamodb_table_name`     | `DYNAMODB_TABLE_NAME`   | \--                                                  |
| `api_gateway_invoke_url`  | \--                     | `NEXT_PUBLIC_API_URL`                                |
| `aws_region`              | `AWS_REGION`            | `NEXT_PUBLIC_COGNITO_REGION`                         |
| `github_actions_role_arn` | \--                     | \-- (used in GitHub Actions workflow)                |
| `amplify_app_id`          | \--                     | \-- (used for Amplify deployments)                   |
| `amplify_app_url`         | \--                     | `NEXT_PUBLIC_APP_URL` (set automatically on Amplify) |

## Tearing Down

This step should only be completed once you’re complete with the class and want to remove all resources from AWS.  If you complete this step, you will need to begin again and re-run the steps above or ask Claude to do it for you.  

To destroy all AWS resources created by Terraform:

```shell
cd infrastructure/environments/staging
terraform destroy
```

**Warning:** This permanently deletes all resources including your DynamoDB table and its data. The state bucket and lock table (created manually in Step 1\) are not managed by Terraform and must be deleted separately via the AWS CLI or console if desired.

**Note:** If DynamoDB deletion protection is enabled (the default), you must disable it in the AWS console or CLI before `terraform destroy` will succeed for that resource.

## Troubleshooting

### "Error: No valid credential sources found"

Run `aws sts get-caller-identity` to verify your AWS credentials are configured. If it fails, run `aws configure` again.

### "Error: Failed to get existing workspaces"

Your S3 state bucket does not exist or is in a different region. Double-check the bucket name and region in `backend.tf`.

### "Error acquiring the state lock"

Another Terraform process is running, or a previous run crashed. Wait for it to finish, or force-unlock:

```shell
terraform force-unlock LOCK_ID
```

### "Error: creating Cognito User Pool: LimitExceededException"

Each AWS account has a default limit of 2 user pools per region. Delete unused pools or request a limit increase via AWS Support.

### "Error: Invalid count argument" or variable-related errors

Make sure you copied `terraform.tfvars.example` to `terraform.tfvars` and filled in all required values. Run `terraform validate` to check for syntax errors.

### Alarm email not receiving notifications

After the first deployment, AWS sends a confirmation email to your `alarm_email` address. You must click the confirmation link before notifications arrive.  
