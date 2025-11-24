#!/bin/bash

# Kola Heritage Platform Setup Script
# This script sets up the development environment

set -e

echo "========================================"
echo "  Kola Heritage Platform Setup"
echo "========================================"
echo ""

# Check if Docker is installed
echo "Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo "[OK] Docker installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo "Error: Docker Compose is not installed"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
echo "[OK] Docker Compose installed"

# Check if Docker is running
if ! docker info &> /dev/null 2>&1; then
    echo "Error: Docker is not running"
    echo "Please start Docker and try again"
    exit 1
fi
echo "[OK] Docker is running"

echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "[OK] Created .env file"
    echo "[!] Remember to update JWT_SECRET for production"
else
    echo "[OK] .env file exists"
fi

# Create uploads directory
mkdir -p backend/uploads
echo "[OK] Uploads directory ready"

echo ""
echo "========================================"
echo "  Setup complete!"
echo "========================================"
echo ""
echo "Quick start:"
echo ""
echo "  docker-compose up"
echo ""
echo "Access:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo "  Health:   http://localhost:5000/health"
echo ""
echo "Useful commands:"
echo "  docker-compose up -d      # Start in background"
echo "  docker-compose logs -f    # View logs"
echo "  docker-compose down       # Stop services"
echo "  docker-compose down -v    # Stop and remove volumes"
echo ""
