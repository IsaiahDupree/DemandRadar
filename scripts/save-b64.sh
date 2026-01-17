#!/bin/bash
# Usage: ./save-b64.sh filename.png "base64data"
echo "$2" | base64 -d > "../docs/screenshots/hookd/$1"
echo "Saved: $1"
