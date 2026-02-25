#!/bin/bash
# Push 对联 to GitHub (send-duilian). Run from project root.

set -e
cd "$(dirname "$0")"

# 1. Avoid push failure with large files (templates are ~88MB)
git config http.postBuffer 524288000

# 2. Ensure we have at least one commit (fixes "refspec main does not match any")
if ! git rev-parse HEAD &>/dev/null; then
  git add -A
  git commit -m "first commit"
fi

# 3. Use main branch
git branch -M main

# 4. Set or update remote
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/DianaY-a11y/send-duilian.git

# 5. Stage and commit any new changes (no-op if clean)
git add -A
if ! git diff --staged --quiet 2>/dev/null; then
  git commit -m "Update project"
fi

# 6. Push to main
git push -u origin main

echo "Done. Repo: https://github.com/DianaY-a11y/send-duilian"
