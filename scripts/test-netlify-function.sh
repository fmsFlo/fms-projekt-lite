#!/bin/bash

# Test script for Netlify Function locally
# Usage: ./scripts/test-netlify-function.sh

echo "🧪 Testing Netlify Function: /.netlify/functions/leads"
echo ""

# Test 1: POST request with email only
echo "Test 1: Creating new lead with email only..."
curl -X POST http://localhost:8888/.netlify/functions/leads \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}' \
  | jq '.'

echo ""
echo "---"
echo ""

# Test 2: POST request with all fields
echo "Test 2: Creating lead with all fields..."
curl -X POST http://localhost:8888/.netlify/functions/leads \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@example.com",
    "name": "Test User",
    "phone": "+49 170 1234567",
    "status": "new",
    "source": "website",
    "address": "Teststraße 123",
    "bank": "Test Bank"
  }' \
  | jq '.'

echo ""
echo "---"
echo ""

# Test 3: Update existing lead
echo "Test 3: Updating existing lead..."
curl -X POST http://localhost:8888/.netlify/functions/leads \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Updated Name",
    "status": "contacted"
  }' \
  | jq '.'

echo ""
echo "---"
echo ""

# Test 4: Missing email (should return 400)
echo "Test 4: Missing email (should return 400)..."
curl -X POST http://localhost:8888/.netlify/functions/leads \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}' \
  | jq '.'

echo ""
echo "---"
echo ""

# Test 5: Wrong method (should return 405)
echo "Test 5: GET request (should return 405)..."
curl -X GET http://localhost:8888/.netlify/functions/leads \
  | jq '.'

echo ""
echo "✅ Tests completed!"
echo ""
echo "Note: Make sure 'netlify dev' is running on port 8888"

