<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# ABPS Books — Development Workflow & Command Policy

## Routine Allowed Commands (No Repeated Approval Required)
The agent should execute routine project commands autonomously without requesting confirmation:
- `npm install`, `npm ci`, `npm test`, `npm run *`
- `npx tsc --noEmit`, `npx next *`, `npx tsx *`
- `git status`, `git diff`, `git diff --check`, `git log`, `git branch`, `git remote -v`, `git ls-files`, `git show`, `git add`, `git commit`

## Dangerous Operations (Explicit Confirmation Required)
Never execute without explicit prior user approval:
- `git push`, `git reset --hard`, `git clean`, `git checkout` (discarding changes), `git restore` (discarding changes), `git rebase`, `git branch -D`, `git tag -d`
- `rm`, `rmdir`, `del`, `Remove-Item` destructive operations
- Database reset, `DROP TABLE`, `DROP DATABASE`, `drizzle-kit push`, destructive migrations, Supabase reset
- Production deployments (`vercel --prod`)
- Changes to `.env` / `.env.local`
- Printing or exposing secrets, passwords, tokens, or credentials
