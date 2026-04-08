param(
    [string]$Message = "chore: auto-commit $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
)

$ErrorActionPreference = "Stop"

git rev-parse --is-inside-work-tree | Out-Null

$changes = git status --porcelain
if (-not $changes) {
    Write-Host "No local changes detected. Nothing to commit/push."
    exit 0
}

$branch = git branch --show-current
if (-not $branch) {
    Write-Error "Could not determine current branch."
    exit 1
}

git add -A
git commit -m $Message
git push origin $branch

Write-Host "Changes committed and pushed to origin/$branch."
