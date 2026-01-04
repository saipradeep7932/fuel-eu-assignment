# Git Workflow - Terminal Only

## 📋 1. AUDIT: Current Git State

### ✅ Tracked Files (Already Committed)
- All source code in `backend/src/` (domain, application, ports, adapters)
- `backend/.gitignore`
- `backend/tsconfig.json`
- `backend/IMPLEMENTATION_PLAN.md`

### ❌ Untracked Files (Why They Exist)

1. **`node_modules/`** - Dependencies folder (IGNORED - correct)
   - **Why**: Auto-generated, huge, platform-specific. Should NEVER be committed.

2. **`package-lock.json`** - Dependency lock file (SHOULD BE COMMITTED)
   - **Why**: Ensures consistent dependency versions across environments.
   - **Action**: Will be committed after fixing .gitignore

3. **`package.json`** - Project dependencies (SHOULD BE COMMITTED)
   - **Why**: Defines project dependencies and scripts.
   - **Action**: Will be committed

4. **`backend/src/adapters/outbound/`** - New code (ALREADY STAGED)
   - **Why**: Just created, ready to commit.

---

## 🔧 2. FIXED: .gitignore (Final Version)

### ✅ What's Ignored (Correct)
- `node_modules/` - Dependencies
- `dist/` - Build output
- `.env*` - Environment variables
- IDE/OS files

### ✅ What's NOT Ignored (Will Be Committed)
- `package.json` - Project config
- `package-lock.json` - Dependency lock (IMPORTANT!)
- All source code in `backend/src/`

**Decision**: `package-lock.json` WILL be committed (Node.js best practice)

---

## 🎯 3. CANONICAL WORKFLOW (Terminal Only)

### The 3-Step Process (ALWAYS FOLLOW THIS)

```
1. Cursor generates code → Files created/modified
2. You commit via terminal → git add + git commit
3. You push to GitHub → git push origin main
```

### Rules:
- ✅ Use terminal ONLY (no UI commit buttons)
- ✅ Commit after each logical feature/change
- ✅ Push after commits to sync with GitHub
- ✅ Always verify with `git status` before committing

---

## 📝 4. STANDARD COMMAND SEQUENCE

### After Cursor Generates Code:

```bash
# Step 1: Check what changed
git status

# Step 2: Add source code files (only)
git add backend/src/

# Step 3: Commit with descriptive message
git commit -m "feat: description of what was added"

# Step 4: Push to GitHub
git push origin main

# Step 5: Verify on GitHub (check in browser)
```

### For Configuration Files (One-Time Setup):

```bash
# Add config files
git add backend/package.json backend/package-lock.json backend/.gitignore backend/tsconfig.json

# Commit
git commit -m "chore: add project configuration files"

# Push
git push origin main
```

### Quick Status Check:

```bash
# See current state
git status

# See what's tracked
git ls-files backend/src

# See recent commits
git log --oneline -5
```

---

## ✅ 5. VALIDATED END STATE

### What `git status` Should Show (Clean State):

```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

### What `git status` Shows (After Code Generation):

```
On branch main
Your branch is up to date with 'origin/main'.

Untracked files:
  backend/src/new-file.ts

nothing added to commit but untracked files present
```

### After Following Commands:

```bash
# 1. Add files
git add backend/src/new-file.ts

# 2. Commit
git commit -m "feat: add new feature"

# 3. Push
git push origin main

# 4. Verify
git status
# Should show: "working tree clean"
```

### GitHub Main Will Reflect:
- ✅ All committed source code
- ✅ All configuration files
- ✅ Complete commit history
- ✅ All changes visible immediately after push

---

## 🚨 TROUBLESHOOTING

### If you see "Untracked files" repeatedly:
- Check if they're in `.gitignore` (should be ignored)
- If they're source files, add and commit them
- If they're `node_modules`, they're correctly ignored

### If commits don't show on GitHub:
- You forgot to `git push origin main`
- Always push after committing

### If "Keep all files" appears in Cursor:
- This is Cursor's UI - IGNORE IT
- Use terminal commands only

---

## 📌 QUICK REFERENCE

```bash
# Standard workflow (after code generation)
git status                                    # Check changes
git add backend/src/                          # Add source files
git commit -m "feat: description"             # Commit
git push origin main                         # Push to GitHub

# Verify
git status                                   # Should be clean
git log --oneline -1                        # See last commit
```

**Remember**: Generate → Commit → Push → Verify

