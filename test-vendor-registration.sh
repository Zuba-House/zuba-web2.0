#!/bin/bash

# Vendor Registration Flow Test Script
# This script tests the complete vendor registration flow

API_URL="http://localhost:5000/api/vendor"
TEST_EMAIL="test-vendor-$(date +%s)@example.com"
STORE_SLUG="test-store-$(date +%s)"

echo "🧪 Testing Vendor Registration Flow"
echo "===================================="
echo ""

# Step 1: Send OTP
echo "📧 Step 1: Sending OTP to $TEST_EMAIL"
SEND_OTP_RESPONSE=$(curl -s -X POST "$API_URL/send-otp" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\"}")

echo "Response: $SEND_OTP_RESPONSE"
echo ""

# Extract OTP from response (if in dev mode)
OTP=$(echo $SEND_OTP_RESPONSE | grep -o '"otp":"[^"]*"' | cut -d'"' -f4)

if [ -z "$OTP" ]; then
  echo "⚠️  OTP not in response. Check server console for OTP code."
  echo "Enter OTP manually: "
  read OTP
fi

echo "🔑 Using OTP: $OTP"
echo ""

# Step 2: Verify OTP
echo "✅ Step 2: Verifying OTP"
VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"otp\":\"$OTP\"}")

echo "Response: $VERIFY_RESPONSE"
echo ""

# Check if verification succeeded
if echo "$VERIFY_RESPONSE" | grep -q '"success":true'; then
  echo "✅ OTP verified successfully"
else
  echo "❌ OTP verification failed"
  exit 1
fi

echo ""

# Step 3: Apply Vendor
echo "📝 Step 3: Applying for vendor account"
APPLY_RESPONSE=$(curl -s -X POST "$API_URL/apply" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\":\"$TEST_EMAIL\",
    \"password\":\"password123\",
    \"name\":\"Test Vendor\",
    \"storeName\":\"Test Store\",
    \"storeSlug\":\"$STORE_SLUG\",
    \"phone\":\"+250123456789\",
    \"country\":\"Rwanda\",
    \"city\":\"Kigali\"
  }")

echo "Response: $APPLY_RESPONSE"
echo ""

# Check if application succeeded
if echo "$APPLY_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Vendor registration successful!"
  
  # Extract token
  TOKEN=$(echo $APPLY_RESPONSE | grep -o '"accesstoken":"[^"]*"' | cut -d'"' -f4)
  
  if [ ! -z "$TOKEN" ]; then
    echo "🔑 Access Token: ${TOKEN:0:50}..."
    echo ""
    
    # Step 4: Test Dashboard (optional)
    echo "📊 Step 4: Testing dashboard access"
    DASHBOARD_RESPONSE=$(curl -s -X GET "$API_URL/dashboard" \
      -H "Authorization: Bearer $TOKEN")
    
    echo "Dashboard Response: $DASHBOARD_RESPONSE"
    
    if echo "$DASHBOARD_RESPONSE" | grep -q '"success":true'; then
      echo "✅ Dashboard access successful!"
    else
      echo "⚠️  Dashboard access failed (may require APPROVED status)"
    fi
  fi
else
  echo "❌ Vendor registration failed"
  exit 1
fi

echo ""
echo "✅ All tests passed!"
echo "Test email: $TEST_EMAIL"
echo "Store slug: $STORE_SLUG"

