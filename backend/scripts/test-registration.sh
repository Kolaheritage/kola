#!/bin/bash

# Test script for user registration endpoint
# Tests various scenarios and displays results

BASE_URL=${1:-http://localhost:5000}
API_URL="$BASE_URL/api/auth/register"

echo "🧪 Testing User Registration Endpoint"
echo "====================================="
echo "API URL: $API_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to run test
run_test() {
    local test_name=$1
    local data=$2
    local expected_status=$3
    
    echo -e "${YELLOW}Test: $test_name${NC}"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "$data")
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$status_code" == "$expected_status" ]; then
        echo -e "${GREEN}✓ Passed${NC} (Status: $status_code)"
    else
        echo -e "${RED}✗ Failed${NC} (Expected: $expected_status, Got: $status_code)"
    fi
    
    echo "Response: $body" | head -c 200
    echo "..."
    echo ""
}

# Generate unique email for valid test
TIMESTAMP=$(date +%s)
UNIQUE_EMAIL="test_${TIMESTAMP}@example.com"
UNIQUE_USERNAME="test_${TIMESTAMP}"

echo "1. Valid Registration"
echo "--------------------"
run_test "Register with valid data" \
    "{\"email\":\"$UNIQUE_EMAIL\",\"username\":\"$UNIQUE_USERNAME\",\"password\":\"password123\"}" \
    "201"

echo "2. Validation Errors"
echo "-------------------"
run_test "Missing email" \
    "{\"username\":\"testuser\",\"password\":\"password123\"}" \
    "400"

run_test "Missing username" \
    "{\"email\":\"test@example.com\",\"password\":\"password123\"}" \
    "400"

run_test "Missing password" \
    "{\"email\":\"test@example.com\",\"username\":\"testuser\"}" \
    "400"

run_test "Invalid email format" \
    "{\"email\":\"invalid-email\",\"username\":\"testuser\",\"password\":\"password123\"}" \
    "400"

run_test "Weak password (< 8 chars)" \
    "{\"email\":\"test2@example.com\",\"username\":\"testuser2\",\"password\":\"pass123\"}" \
    "400"

run_test "Password without number" \
    "{\"email\":\"test3@example.com\",\"username\":\"testuser3\",\"password\":\"passwordonly\"}" \
    "400"

run_test "Username too short" \
    "{\"email\":\"test4@example.com\",\"username\":\"ab\",\"password\":\"password123\"}" \
    "400"

run_test "Username with spaces" \
    "{\"email\":\"test5@example.com\",\"username\":\"test user\",\"password\":\"password123\"}" \
    "400"

echo "3. Duplicate Tests"
echo "-----------------"
run_test "Duplicate email" \
    "{\"email\":\"$UNIQUE_EMAIL\",\"username\":\"different_user\",\"password\":\"password123\"}" \
    "409"

run_test "Duplicate username" \
    "{\"email\":\"different@example.com\",\"username\":\"$UNIQUE_USERNAME\",\"password\":\"password123\"}" \
    "409"

echo ""
echo "====================================="
echo "✅ Test Suite Complete"
echo ""
echo "Registered test user:"
echo "  Email: $UNIQUE_EMAIL"
echo "  Username: $UNIQUE_USERNAME"
echo ""
echo "To clean up test users:"
echo "  docker exec -it heritage_db psql -U heritage_user -d heritage_db \\"
echo "    -c \"DELETE FROM users WHERE email LIKE 'test_%@example.com';\""