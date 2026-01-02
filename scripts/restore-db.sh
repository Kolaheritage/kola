#!/bin/bash

###############################################################################
# Database Restore Script for Heritage Platform
# HER-80: Production Database Setup
#
# This script restores a PostgreSQL backup using pg_restore
#
# Usage:
#   ./scripts/restore-db.sh <backup-file> [environment]
#
# Arguments:
#   backup-file  - Path to the backup file to restore
#   environment  - Optional. Either 'development' or 'production' (default: development)
#
# Examples:
#   ./scripts/restore-db.sh backups/backup_production_20260102_120000.dump
#   ./scripts/restore-db.sh backups/backup_production_20260102_120000.dump development
#
# WARNING: This will OVERWRITE the target database!
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ -z "$1" ]; then
    echo -e "${RED}Error: Backup file not specified!${NC}"
    echo ""
    echo "Usage: $0 <backup-file> [environment]"
    echo ""
    echo "Examples:"
    echo "  $0 backups/backup_production_20260102_120000.dump"
    echo "  $0 backups/backup_production_20260102_120000.dump development"
    exit 1
fi

BACKUP_FILE=$1
ENVIRONMENT=${2:-development}

echo -e "${YELLOW}=== Heritage Platform Database Restore ===${NC}"
echo "Backup file: ${BACKUP_FILE}"
echo "Target environment: ${ENVIRONMENT}"
echo ""

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: ${BACKUP_FILE}${NC}"
    exit 1
fi

# Load environment variables
if [ "$ENVIRONMENT" = "production" ]; then
    echo -e "${RED}⚠️  WARNING: You are about to restore to PRODUCTION!${NC}"
    echo -e "${RED}This will OVERWRITE the production database!${NC}"
    echo ""
    read -p "Are you absolutely sure? Type 'yes' to continue: " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Restore cancelled"
        exit 0
    fi

    if [ ! -f .env.production ]; then
        echo -e "${RED}Error: .env.production file not found!${NC}"
        exit 1
    fi
    source .env.production
elif [ "$ENVIRONMENT" = "development" ]; then
    echo -e "${YELLOW}Restoring to development database${NC}"
    echo ""
    read -p "This will overwrite the development database. Continue? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Restore cancelled"
        exit 0
    fi

    if [ ! -f .env ]; then
        echo -e "${RED}Error: .env file not found!${NC}"
        exit 1
    fi
    source .env
else
    echo -e "${RED}Error: Invalid environment '${ENVIRONMENT}'${NC}"
    echo "Valid options: production, development"
    exit 1
fi

# Check for required tools
if ! command -v pg_restore &> /dev/null; then
    echo -e "${RED}Error: pg_restore not found!${NC}"
    echo "Please install PostgreSQL client tools"
    exit 1
fi

# Set password for pg_restore
export PGPASSWORD="$DB_PASSWORD"

echo ""
echo -e "${GREEN}Starting restore...${NC}"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo ""

# Restore backup
if pg_restore \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c \
    --if-exists \
    --verbose \
    "$BACKUP_FILE"; then

    echo ""
    echo -e "${GREEN}✅ Restore completed successfully!${NC}"
else
    echo ""
    echo -e "${RED}❌ Restore failed!${NC}"
    echo "Note: Some errors may be expected (e.g., dropping non-existent objects)"
    exit 1
fi

# Unset password
unset PGPASSWORD

echo ""
echo -e "${GREEN}=== Restore Complete ===${NC}"
