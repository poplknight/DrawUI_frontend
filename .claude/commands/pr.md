# Create PR

Automate PR creation with proper tags, labels, and concise summary.

## Step 1: Check Prerequisites

```bash
# Ensure you have uncommitted changes
git status

# If changes exist, commit them first
git add .
git commit -m "[tag] Your commit message"
```

## Step 2: Push and Create PR

You'll create the PR with the following structure:

### PR Tags (use in title)

- `[feat]` - New features → label: `enhancement`
- `[bugfix]` - Bug fixes → label: `verified bug`
- `[refactor]` - Code restructuring → label: `enhancement`
- `[docs]` - Documentation → label: `documentation`
- `[test]` - Test changes → label: `enhancement`
- `[ci]` - CI/CD changes → label: `enhancement`

### Label Mapping

#### General Labels

- Feature/Enhancement: `enhancement`
- Bug fixes: `verified bug`
- Documentation: `documentation`
- Dependencies: `dependencies`
- Performance: `Performance`
- Desktop app: `Electron`

## Step 3: Execute PR Creation

```bash
# First, push your branch
git push -u origin $(git branch --show-current)

# Then create the PR (replace placeholders)
gh pr create \
  --title "[TAG] Brief description" \
  --body "$(cat <<'EOF'
## Summary
One sentence describing what changed and why.

## Changes
- **What**: Core functionality added/modified
- **Breaking**: Any breaking changes (if none, omit this line)
- **Dependencies**: New dependencies (if none, omit this line)

## Review Focus
- Critical design decisions or edge cases that need attention

Fixes #ISSUE_NUMBER
EOF
)" \
  --label "APPROPRIATE_LABEL" \
  --base main
```

## Additional Options

- Add multiple labels: `--label "enhancement,Performance"`
- Request reviewers: `--reviewer @username`
- Mark as draft: `--draft`
- Open in browser after creation: `--web`
