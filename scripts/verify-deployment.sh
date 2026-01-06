#!/bin/bash

###############################################################################
# Deployment Verification Script
# HER-81: Backend Deployment Setup
#
# This script verifies that the backend deployment is working correctly
#
# Usage:
#   ./scripts/verify-deployment.sh <backend-url>
#
# Examples:
#   ./scripts/verify-deployment.sh https://heritage-backend.onrender.com
#   ./scripts/verify-deployment.sh http://localhost:5002
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check arguments
# Use environment variable if argument is not provided
BACKEND_URL=${1:-$BACKEND_URL}

# Check if URL is available
if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}Error: Backend URL not specified!${NC}"
    echo ""
    echo "Usage: $0 [backend-url]"
    echo "Or set BACKEND_URL environment variable"
    echo ""
    echo "Examples:"
    echo "  $0 https://heritage-backend.onrender.com"
    echo "  $0 http://localhost:5002"
    exit 1
fi

# Remove trailing slash if present
BACKEND_URL=${BACKEND_URL%/}

echo -e "${BLUE}=== Heritage Platform Backend Deployment Verification ===${NC}"
echo "Backend URL: ${BACKEND_URL}"
echo ""

# Test counter
PASSED=0
FAILED=0
TOTAL=0

# Helper function to run tests
run_test() {
    local test_name=$1
    local endpoint=$2
    local expected_status=${3:-200}
    local check_body=${4:-""}

    TOTAL=$((TOTAL + 1))
    echo -e "${YELLOW}Test $TOTAL: $test_name${NC}"
    echo "  Endpoint: $endpoint"

    # Make request and capture status code and body
    response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL$endpoint" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    # Check status code
    if [ "$http_code" = "$expected_status" ]; then
        # Check body content if specified
        if [ -n "$check_body" ]; then
            if echo "$body" | grep -q "$check_body"; then
                echo -e "  ${GREEN}✅ PASSED${NC} (Status: $http_code, Body contains: '$check_body')"
                PASSED=$((PASSED + 1))
            else
                echo -e "  ${RED}❌ FAILED${NC} (Status: $http_code, but body doesn't contain: '$check_body')"
                echo "  Response: $body"
                FAILED=$((FAILED + 1))
            fi
        else
            echo -e "  ${GREEN}✅ PASSED${NC} (Status: $http_code)"
            PASSED=$((PASSED + 1))
        fi
    else
        echo -e "  ${RED}❌ FAILED${NC} (Expected: $expected_status, Got: $http_code)"
        echo "  Response: $body"
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

# Run tests
echo -e "${BLUE}Running verification tests...${NC}"
echo ""

# Test 1: Health Check
run_test "Health Check" "/health" 200 "healthy"

# Test 2: Database Connection
run_test "Database Connection (via health)" "/health" 200 "connected"

# Test 3: API Info
run_test "API Information" "/api" 200 "Heritage Platform API"

# Test 4: API Documentation
run_test "Swagger Documentation" "/api-docs" 301 # Redirects to /api-docs/

# Test 5: Auth Endpoints Exist
run_test "Auth Register Endpoint" "/api/auth/register" 400 # POST required, but endpoint exists

# Test 6: Categories Endpoint
run_test "Categories Endpoint" "/api/categories" 200

# Test 7: Content Endpoint
run_test "Content Endpoint" "/api/content" 200

# Test 8: Users Endpoint (requires auth)
run_test "Users Endpoint" "/api/users/me" 401 # Unauthorized (expected)

# Summary
echo -e "${BLUE}=== Verification Complete ===${NC}"
echo ""
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

# Calculate success rate
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
    echo "Success Rate: ${SUCCESS_RATE}%"
    echo ""
fi

# Final status
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Deployment is healthy.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the errors above.${NC}"
    echo ""
    echo "Common issues:"
    echo "  - Database not connected: Check Supabase credentials"
    echo "  - 503 errors: Service may still be starting (wait 1-2 minutes)"
    echo "  - 404 errors: Check backend URL is correct"
    exit 1
fi
