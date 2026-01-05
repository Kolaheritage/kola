#!/bin/bash

###############################################################################
# Database Backup Script for Heritage Platform
# HER-80: Production Database Setup
#
# This script creates a PostgreSQL backup using pg_dump
#
# Usage:
#   ./scripts/backup-db.sh [environment]
#
# Arguments:
#   environment - Optional. Either 'development' or 'production' (default: production)
#
# Examples:
#   ./scripts/backup-db.sh              # Backup production
#   ./scripts/backup-db.sh production   # Backup production
#   ./scripts/backup-db.sh development  # Backup development
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${ENVIRONMENT}_${TIMESTAMP}.dump"

echo -e "${GREEN}=== Heritage Platform Database Backup ===${NC}"
echo "Environment: ${ENVIRONMENT}"
echo "Timestamp: ${TIMESTAMP}"
echo ""

# Load environment variables
if [ "$ENVIRONMENT" = "production" ]; then
    if [ ! -f .env.production ]; then
        echo -e "${RED}Error: .env.production file not found!${NC}"
        echo "Please create .env.production with your Supabase credentials"
        exit 1
    fi
    source .env.production
    echo -e "${YELLOW}Using production database credentials${NC}"
elif [ "$ENVIRONMENT" = "development" ]; then
    if [ ! -f .env ]; then
        echo -e "${RED}Error: .env file not found!${NC}"
        exit 1
    fi
    source .env
    echo -e "${YELLOW}Using development database credentials${NC}"
else
    echo -e "${RED}Error: Invalid environment '${ENVIRONMENT}'${NC}"
    echo "Valid options: production, development"
    exit 1
fi

# Check for required tools
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}Error: pg_dump not found!${NC}"
    echo "Please install PostgreSQL client tools:"
    echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
    echo "  macOS: brew install postgresql"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Set password for pg_dump
export PGPASSWORD="$DB_PASSWORD"

echo -e "${GREEN}Starting backup...${NC}"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "Output: $BACKUP_FILE"
echo ""

# Create backup
if pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -F c \
    -f "$BACKUP_FILE" \
    --verbose; then

    # Get file size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)

    echo ""
    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo "File: $BACKUP_FILE"
    echo "Size: $BACKUP_SIZE"

    # List recent backups
    echo ""
    echo -e "${GREEN}Recent backups:${NC}"
    ls -lh "$BACKUP_DIR" | grep "backup_${ENVIRONMENT}" | tail -n 5

    # Cleanup old backups (keep last 7)
    echo ""
    echo -e "${YELLOW}Cleaning up old backups (keeping last 7)...${NC}"
    ls -t "$BACKUP_DIR"/backup_${ENVIRONMENT}_*.dump | tail -n +8 | xargs -r rm
    echo -e "${GREEN}Cleanup complete${NC}"
else
    echo ""
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

# Unset password
unset PGPASSWORD

echo ""
echo -e "${GREEN}=== Backup Complete ===${NC}"
