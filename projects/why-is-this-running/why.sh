#!/usr/bin/env bash
# Bash wrapper for why-is-this-running
# Usage: ./why-is-this-running.sh [--kill | --nice]

SCRIPT_DIR = "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON = $(which python3)

# Forward arguments to python helper
$PYTHON "$SCRIPT_DIR/why.py" "$@"