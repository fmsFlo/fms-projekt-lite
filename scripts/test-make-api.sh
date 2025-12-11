#!/bin/bash

# Test script for Make API integration
# Usage: ./scripts/test-make-api.sh

echo "🧪 Testing Make API: /api/make/search"
echo ""

# Test Make API search
echo "Test: Searching for customers via Make API..."
curl -X POST http://localhost:3000/api/make/search \
  -H "Content-Type: application/json" \
  -H "Cookie: session=admin:cmj13mi550000ckewjpffn8e3" \
  -d '{"query": "test"}' \
  | jq '.'

echo ""
echo "---"
echo ""

echo "✅ Test completed!"
echo ""
echo "Note: Make sure 'npm run dev' is running on port 3000"
echo "Note: Make sure Make Webhook URL is configured in Settings"

