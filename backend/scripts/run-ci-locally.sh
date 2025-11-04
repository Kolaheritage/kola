#!/bin/bash

# Script to run CI checks locally before pushing
# Simulates GitHub Actions CI pipeline

set -e

echo "🔍 Running CI Checks Locally"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

# Function to run a check
run_check() {
    local name=$1
    local command=$2
    local dir=$3
    
    echo -e "${YELLOW}⏳ Running: $name${NC}"
    
    if [ -n "$dir" ]; then
        (cd "$dir" && eval "$command")
    else
        eval "$command"
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $name passed${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}❌ $name failed${NC}"
        echo ""
        FAILED=1
        return 1
    fi
}

# Backend checks
echo "🔧 Backend Checks"
echo "-----------------"

run_check "Backend - Install Dependencies" "npm ci" "backend"
run_check "Backend - ESLint" "npm run lint" "backend"
run_check "Backend - Prettier Check" "npm run format:check" "backend"
run_check "Backend - Tests" "npm test" "backend"
run_check "Backend - Syntax Check" "node -c src/server.js" "backend"

echo ""

# Frontend checks
echo "⚛️  Frontend Checks"
echo "------------------"

run_check "Frontend - Install Dependencies" "npm ci" "frontend"
run_check "Frontend - ESLint" "npm run lint" "frontend"
run_check "Frontend - Prettier Check" "npm run format:check" "frontend"
run_check "Frontend - Tests" "npm test -- --watchAll=false" "frontend"
run_check "Frontend - Build" "npm run build" "frontend"

echo ""

# Docker checks (optional)
echo "🐳 Docker Checks"
echo "----------------"

if command -v docker &> /dev/null; then
    run_check "Backend Docker Build" "docker build -t heritage-backend:test ./backend" "."
    run_check "Frontend Docker Build" "docker build -t heritage-frontend:test ./frontend" "."
else
    echo -e "${YELLOW}⚠️  Docker not found, skipping Docker checks${NC}"
    echo ""
fi

# Summary
echo "=============================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "You can safely push your changes."
    exit 0
else
    echo -e "${RED}❌ Some checks failed${NC}"
    echo ""
    echo "Please fix the issues before pushing."
    exit 1
fi