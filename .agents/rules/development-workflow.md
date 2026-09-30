---
description: Development workflow and command authorization rules for ABPS Books
globs: "*"
alwaysApply: true
---

# ABPS Books — Development Workflow & Command Authorization Policy

## 1. Routine Allowed Commands (Autonomous Execution)
The agent is authorized to execute the following routine project commands directly without requiring repeated manual user approval:

- `npm install`
- `npm ci`
- `npm test`
- `npm run *` (e.g. `npm run build`, `npm run dev`, `npm run lint`)
- `npx tsc --noEmit`
- `npx next *`
- `npx tsx *`
- `git status`
- `git diff`
- `git diff --check`
- `git log`
- `git branch`
- `git remote -v`
- `git ls-files`
- `git show`
- `git add`
- `git commit`

These commands are safe, routine inspection, compilation, testing, and staging actions within the local workspace.

---

## 2. Dangerous & Destructive Operations (STRICT APPROVAL REQUIRED)
The agent MUST NEVER execute any of the following commands or operations without explicit, prior user confirmation in the conversation turn:

### Git Operations
- `git push` (pushing commits or tags to remote repository)
- `git reset --hard` (destructive rollback of working tree)
- `git clean` (untracked file removal)
- `git checkout` that discards working copy modifications
- `git restore` that discards working copy changes
- `git rebase` (history rewriting)
- `git branch -D` (forced branch deletion)
- `git tag -d` (tag deletion)

### Filesystem & Deletion Operations
- `rm`, `rmdir`, `del`, `Remove-Item` targeting project assets or critical files
- Mass file deletions or directory removals

### Database & Migration Operations
- Database reset or schema recreation
- SQL execution of `DROP TABLE`, `DROP DATABASE`, `DROP SCHEMA`, `TRUNCATE`
- `drizzle-kit push` (bypasses controlled migrations)
- Destructive migration files or commands that drop production/staging columns
- Supabase project or database reset

### Credentials & Deployments
- Production deployments (e.g. `vercel --prod`)
- Any modifications to `.env` or `.env.local`
- Any commands or scripts that print, log, or expose passwords, service-role keys, tokens, or credentials

---

## 3. Security & Application Integrity
- Never weaken application authentication or authorization guards.
- Development-only personas remain strictly gated behind non-production environments.
- Server-side role resolution and data ownership verification remain non-negotiable.
