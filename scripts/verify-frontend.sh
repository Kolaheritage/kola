#!/bin/bash

###############################################################################
# Frontend Deployment Verification Script
# HER-82: Frontend Deployment Setup
#
# This script verifies that the frontend deployment is working correctly
# and can connect to the backend API
#
# Usage:
#   ./scripts/verify-frontend.sh <frontend-url> <backend-url>
#
# Examples:
#   ./scripts/verify-frontend.sh https://heritage-platform.vercel.app https://heritage-backend.onrender.com
#   ./scripts/verify-frontend.sh http://localhost:3000 http://localhost:5002
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check arguments
if [ -z "$1" ] || [ -z "$2" ]; then
    echo -e "${RED}Error: URLs not specified!${NC}"
    echo ""
    echo "Usage: $0 <frontend-url> <backend-url>"
    echo ""
    echo "Examples:"
    echo "  $0 https://heritage-platform.vercel.app https://heritage-backend.onrender.com"
    echo "  $0 http://localhost:3000 http://localhost:5002"
    exit 1
fi

FRONTEND_URL=$1
BACKEND_URL=$2
# Remove trailing slashes if present
FRONTEND_URL=${FRONTEND_URL%/}
BACKEND_URL=${BACKEND_URL%/}

echo -e "${BLUE}=== Heritage Platform Frontend Deployment Verification ===${NC}"
echo "Frontend URL: ${FRONTEND_URL}"
echo "Backend URL: ${BACKEND_URL}"
echo ""

# Test counter
PASSED=0
FAILED=0
TOTAL=0

# Helper function to run tests
run_test() {
    local test_name=$1
    local url=$2
    local expected_status=${3:-200}
    local check_content=${4:-""}

    TOTAL=$((TOTAL + 1))
    echo -e "${YELLOW}Test $TOTAL: $test_name${NC}"
    echo "  URL: $url"

    # Make request and capture status code and response
    response=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    # Check status code
    if [ "$http_code" = "$expected_status" ]; then
        # Check content if specified
        if [ -n "$check_content" ]; then
            if echo "$body" | grep -qi "$check_content"; then
                echo -e "  ${GREEN}✅ PASSED${NC} (Status: $http_code, Contains: '$check_content')"
                PASSED=$((PASSED + 1))
            else
                echo -e "  ${RED}❌ FAILED${NC} (Status: $http_code, but missing: '$check_content')"
                echo "  Response preview: $(echo "$body" | head -c 200)..."
                FAILED=$((FAILED + 1))
            fi
        else
            echo -e "  ${GREEN}✅ PASSED${NC} (Status: $http_code)"
            PASSED=$((PASSED + 1))
        fi
    else
        echo -e "  ${RED}❌ FAILED${NC} (Expected: $expected_status, Got: $http_code)"
        echo "  Response preview: $(echo "$body" | head -c 200)..."
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

# Run frontend tests
echo -e "${BLUE}Running frontend tests...${NC}"
echo ""

# Test 1: Homepage loads
run_test "Homepage Loads" "$FRONTEND_URL" 200 "root"

# Test 2: Static assets accessible
run_test "Static Assets (favicon)" "$FRONTEND_URL/favicon.ico" 200

# Test 3: Manifest exists
run_test "PWA Manifest" "$FRONTEND_URL/manifest.json" 200

# Test 4: React App HTML structure
run_test "React App Structure" "$FRONTEND_URL" 200 "div id=\"root\""

# Test 5: SPA Routing (about page should still return index.html)
run_test "SPA Routing Support" "$FRONTEND_URL/about" 200 "root"

# Run backend connection tests
echo -e "${BLUE}Running backend connection tests...${NC}"
echo ""

# Test 6: Backend health check
run_test "Backend Health Check" "$BACKEND_URL/health" 200 "healthy"

# Test 7: Backend API accessible
run_test "Backend API Info" "$BACKEND_URL/api" 200 "Heritage Platform API"

# Test 8: Backend categories endpoint
run_test "Backend Categories Endpoint" "$BACKEND_URL/api/categories" 200

# Additional checks
echo -e "${BLUE}Additional Checks...${NC}"
echo ""

# Check if frontend can be accessed over HTTPS
if [[ $FRONTEND_URL == https://* ]]; then
    echo -e "${GREEN}✅ SSL/HTTPS enabled${NC}"
else
    echo -e "${YELLOW}⚠️  Not using HTTPS (OK for localhost)${NC}"
fi
echo ""

# Check if backend can be accessed over HTTPS
if [[ $BACKEND_URL == https://* ]]; then
    echo -e "${GREEN}✅ Backend using HTTPS${NC}"
else
    echo -e "${YELLOW}⚠️  Backend not using HTTPS (OK for localhost)${NC}"
fi
echo ""

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
    echo -e "${GREEN}🎉 All tests passed! Frontend deployment is healthy.${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Test user registration and login"
    echo "  2. Verify API integration in browser"
    echo "  3. Test content creation and upload"
    echo "  4. Set up monitoring (Google Analytics, Sentry)"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the errors above.${NC}"
    echo ""
    echo "Common issues:"
    echo "  - Frontend not accessible: Check deployment status in Vercel"
    echo "  - Backend connection failed: Check REACT_APP_API_URL environment variable"
    echo "  - CORS errors: Update backend CORS configuration"
    echo "  - 404 errors: Check URLs are correct"
    exit 1
fi
