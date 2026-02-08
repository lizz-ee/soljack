#!/usr/bin/env bash
# Launch Claude Code in bypass mode with auto-updates
# Uses Claude Sonnet 4.5 in the current repository
# Usage: ./start.sh [optional claude args]

set -e

# Navigate to the repo root (where this script lives)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
echo "🚀 Starting Claude Code in: $SCRIPT_DIR"

# Check for updates and install if available
echo "🔄 Checking for Claude Code updates..."
CURRENT=$(claude --version 2>/dev/null | grep -oP '\d+\.\d+\.\d+' || echo "not installed")
LATEST=$(npm view @anthropic-ai/claude-code version 2>/dev/null || echo "")

if [ "$CURRENT" = "not installed" ]; then
  echo "📦 Installing Claude Code..."
  npm install -g @anthropic-ai/claude-code@latest
  echo "✅ Claude Code installed successfully"
elif [ -n "$LATEST" ] && [ "$CURRENT" != "$LATEST" ]; then
  echo "⬆️  Updating Claude Code: $CURRENT → $LATEST"
  npm install -g @anthropic-ai/claude-code@latest
  echo "✅ Updated successfully"
else
  echo "✅ Claude Code is up to date ($CURRENT)"
fi

echo ""
echo "🤖 Launching Claude Code with:"
echo "   • Model: Claude Haiku 4.5"
echo "   • Mode: Bypass (dangerously-skip-permissions)"
echo "   • Working directory: $SCRIPT_DIR"
echo ""

# Launch Claude Code in bypass mode with Haiku 4.5
claude --dangerously-skip-permissions --model claude-haiku-4-5-20251001 "$@"
