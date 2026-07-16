# Setup Guide

A step-by-step guide to setting up your local development environment for the Mindful AI Sandbox project. 

---

## Table of Contents

1. [Required Accounts](#1-required-accounts)
2. [Prerequisites](#2-prerequisites)
3. [Install Required Software](#3-install-required-software)
4. [Clone the Repository](#4-clone-the-repository)
5. [Install Dependencies](#5-install-dependencies)
6. [Start the Development Servers](#6-start-the-development-servers)
7. [Verify Everything Works](#7-verify-everything-works)
8. [Test Accounts](#8-test-accounts)
9. [Running Tests](#9-running-tests)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Required Accounts

Create the following accounts before the first class. Both are free to set up.

| Account    | Sign-Up Link                                   | Why You Need It                                                                                                                                                                                             |
| ---------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Claude** | [claude.ai](https://claude.ai/)                | Required to authenticate Claude Code, the AI development tool used throughout the course.  You can either use the desktop app or the default command line for the class.                                    |
| **GitHub** | [github.com/signup](https://github.com/signup) | Used to host your repository, collaborate with version control, and run CI/CD pipelines.  After creating your GitHub account, email your username to your instructor so they can add you to the class repo. |

---

## 2. Prerequisites

Before you begin, make sure your laptop meets the following requirements:

| Requirement      | Details                                                |
| ---------------- | ------------------------------------------------------ |
| Operating System | Windows 10/11, macOS 12+, or Ubuntu 22.04+             |
| RAM              | 8 GB minimum (16 GB recommended)                       |
| Disk Space       | At least 2 GB free for project files and dependencies  |
| Internet         | Required for downloading packages and cloning the repo |
| Terminal         | A terminal application                                 |

---

## 3. Install Required Software

Install each of the following tools.  They enable you to develop, run and test the Mindful AI Sandbox appliation on your local computer.

### 3.1 A Terminal Application

You need a terminal to run commands:

* **Windows**: Git Bash (installed with Git) or Windows Command Line (Default)
* **macOS**: Terminal.app or iTerm2
* **Linux**: Your distribution's default terminal
  
  

## 3.2 Git

Git is the version control system used to manage the project source code.

- **Windows**: Download from [git-scm.com](https://git-scm.com/download/win). During installation, accept the default options. This also installs Git Bash, which you can use as your terminal.
- **macOS**: Run `xcode-select --install` in Terminal, or download from [git-scm.com](https://git-scm.com/download/mac).
- **Linux**: Run `sudo apt install git` (Debian/Ubuntu) or `sudo dnf install git` (Fedora).

Verify the installation by typing the following at the command line or terminal:

```bash
git --version
```



### 3.3 Node.js 22 and npm 10

The backend and frontend both require Node.js 22 or higher and npm 10 or higher.

**Recommended approach -- use NVM (Node Version Manager):**

The project includes an `.nvmrc` file set to Node 22, so NVM will automatically pick the correct version.

- **Windows**: Install [nvm-windows](https://github.com/coreybutler/nvm-windows/releases) from Github. Download the installer (`nvm-setup.exe`) and run it.
- **macOS or Linux**: Install nvm by running the following command at the command line or terminal:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

Then restart your terminal and install Node 22:

```bash
nvm install 22
nvm use 22
```

**Alternative -- direct download:**

Download the Node.js LTS installer from [nodejs.org](https://nodejs.org/) and run it. npm is included with Node.js.

Verify the installation by typing the following at the command line or terminal:

```bash
node --version    # should show v22.x.x
npm --version     # should show 10.x.x
```

### 3.4 Claude Code

This course uses [Claude Code](https://docs.anthropic.com/en/docs/claude-code) as the primary development tool. Claude Code is Anthropic's CLI for Claude that runs in your terminal and can read, write, and edit code directly.  Note that Claude Code requires a $20/month subscription and there is no longer a free tier.  

Follow the official installation instructions at [docs.anthropic.com](https://docs.anthropic.com/en/docs/claude-code/getting-started) to install and authenticate Claude Code.

### 3.5 Python 3

Python 3.8+ is required to run the local development launcher script (`scripts/RunLocal.py`) that starts both the backend and frontend servers.

- **Windows**: Download from [python.org](https://www.python.org/downloads/). During installation, check **"Add python.exe to PATH"**.
- **macOS**: Run `brew install python` (Homebrew) or download from [python.org](https://www.python.org/downloads/).
- **Linux**: Run `sudo apt install python3` (Debian/Ubuntu) or `sudo dnf install python3` (Fedora).

Verify the installation by typing the following at the command line or terminal:

```bash
python --version   # or python3 --version
```

---

## 4. Create Your Own Copy of the Repository

Create your own private copy of the mindful-ai-sandbox repository  using GitHub's "Use this template" feature.  Your instructor will send you two emails, one with a link to the @Fictivize organization and one with a link to the repo, that you will use in these steps.

1. Log in to GitHub.
2. Open the email from GitHub with the subject "@ajauch has invited you to join the @Fictivize organization". Click the **Join @Fictivize** button in the email to open the Fictivize organization in GitHub.
3. Open the email from your instructor, Alex Jauch, with the subject "Repo". Click the link in the email to open the mindful-ai-sandbox repo in GitHub. 
4. Click the green **Use this template** button near the top of the page.
5. On the Create a new repository screen, provide the following information:
   * **Owner**: Select your own GitHub account.
   * **Repository name**: Choose any name you like (e.g., `my-project`). You sure you don't want to use some standard name for the class to make it easier to find? Some people could have dozens of repositories, right? Or forget what they named it which makes it difficult when they ask for your help.]
   * **Choose Visibility**: Set to **Private**.
6. Click  **Create repository**. GitHub will create an independent copy under your account.
7. Lastly, clone it to your local machine by typing the following in the terminal:

```bash
git clone https://github.com/<your-username>/<your-repo-name>
cd <your-repo-name>
```

Replace `<your-username>` and `<your-repo-name>` with your actual GitHub username and the repo name you chose.

---

## 5. Install Dependencies

Before running the development servers on your computer for the first time, install the npm packages for both the backend and frontend by typing the following commands into the terminal after navigating to your project directory:

```bash
cd backend 
npm install
cd ../frontend && npm install

```

This may take a minute or two on the first run.

---

## 6. Start the Development Servers

From the project root directory, run the launcher script:

```bash
python scripts/RunLocal.py
```

The script does the following:

1. Kill any processes already running on ports 3000 and 3001
2. Copy environment template files if they do not already exist
3. Start the backend server on **http://localhost:3001** (with mock auth)
4. Wait for the backend health check to pass
5. Start the frontend server on **http://localhost:3000**
6. Wait for the frontend to become ready
7. Display the URLs and test account credentials

Leave this running for the next step.  When you want to stop the servers, Press **Ctrl+C** to stop both.

---

## 7. Verify Everything Works

Once both servers are running, do the following:

1. Open **http://localhost:3000** in your browser.  You will see the application home page.
2. Click **Sign In** and log in with a test account (see below).
3. After logging in, you will be redirected to your profile page.
4. Open **http://localhost:3001/health** in your browser or via `curl` -- in the terminal.  You will see a health check JSON response.
   
   

```bash
{"status":"ok","timestamp":"2026-06-05T18:55:12.485Z","service":"sandbox-backend","environment":"development"}
```

---

### 7.1 Test Accounts

When running in local mock auth mode (`AUTH_MODE=local`), the following test accounts are available:

| Username     | Email                    | Password         | Role  |
| ------------ | ------------------------ | ---------------- | ----- |
| `test_user1` | `user1@sandbox-test.com` | `SandboxUser1!`  | User  |
| `test_user2` | `user2@sandbox-test.com` | `SandboxUser1!`  | User  |
| `test_admin` | `admin@sandbox-test.com` | `SandboxAdmin1!` | Admin |

You can also register new accounts through the signup page. New accounts persist in memory for the duration of the server process (they are lost when the backend restarts).

---

## 

## 8. Troubleshooting

### "Port 3000 (or 3001) is already in use"

Another process is using the port. Kill it:

- **Windows**: `netstat -ano | findstr :3001` to find the PID, then `taskkill /F /PID <pid>`
- **macOS / Linux**: `lsof -i :3001` to find the PID, then `kill <pid>`

Or use the `scripts/RunLocal.py` launcher, which automatically clears the ports before starting.

### "npm install" fails

- Make sure you are using Node.js 22+ and npm 10+. Run `node --version` and `npm --version` to check.
- Delete `node_modules/` and `package-lock.json`, then run `npm install` again:

```bash
rm -rf node_modules package-lock.json
npm install
```

### "Module not found" errors when starting a server

Run `npm install` in the appropriate directory (`backend/` or `frontend/`). Dependencies may not have been installed yet.

### Pre-commit hooks fail

The project uses Husky to run linting and type checks before each commit. If a commit fails:

1. Read the error output to identify the issue (usually a lint or type error).
2. Fix the issue in your code.
3. Stage the changes and commit again.

Do not bypass hooks with `--no-verify`. Fix the underlying issue instead.

### Frontend shows a blank page or API errors

- Confirm the backend is running on port 3001.
- Check that `frontend/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:3001`.
- Open the browser developer console (F12) to see error details.

### "command not found: python"

Try `python3` instead of `python`. On Windows, you may need to install Python from [python.org](https://www.python.org/downloads/) or the Microsoft Store.
