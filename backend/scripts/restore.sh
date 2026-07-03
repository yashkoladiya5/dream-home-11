#!/bin/bash
set -eo pipefail

SCRIPT_NAME=$(basename "$0")

show_help() {
  cat <<EOF
Usage: ${SCRIPT_NAME} <backup-file>

Restore a PostgreSQL database from a backup file created by backup.sh.
Validates the backup file, shows a confirmation prompt, drops existing
connections, and restores the database.

Arguments:
  backup-file           Path to the backup file (.sql or .sql.gz)

Environment variables:
  DATABASE_URL          Full PostgreSQL connection URL
  DB_HOST               Database host (used if DATABASE_URL not set)
  DB_PORT               Database port (default: 5432)
  DB_USERNAME           Database user
  DB_PASSWORD           Database password
  DB_DATABASE           Database name

Examples:
  ${SCRIPT_NAME} ./backups/backup-dream_home_11-20250101-120000.sql.gz
  ${SCRIPT_NAME} /path/to/backup.sql
  DATABASE_URL=postgres://user:pass@host:5432/db ${SCRIPT_NAME} backup.sql.gz
EOF
  exit 0
}

if [ $# -lt 1 ] || [ "$1" = "--help" ]; then
  show_help
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

if [[ ! "${BACKUP_FILE}" =~ \.sql(\.gz)?$ ]]; then
  echo "Error: Backup file must have .sql or .sql.gz extension"
  echo "Got: ${BACKUP_FILE}"
  exit 1
fi

if [ -z "$DATABASE_URL" ]; then
  if [ -z "$DB_HOST" ] || [ -z "$DB_PASSWORD" ]; then
    if [ -f .env.production ]; then
      echo "Loading environment from .env.production..."
      set -a
      source .env.production
      set +a
    elif [ -f ../.env.production ]; then
      echo "Loading environment from ../.env.production..."
      set -a
      source ../.env.production
      set +a
    else
      echo "Error: No DATABASE_URL set and no .env.production found"
      exit 1
    fi
  fi

  DB_HOST="${DB_HOST:-localhost}"
  DB_PORT="${DB_PORT:-5432}"
  DB_USERNAME="${DB_USERNAME:-postgres}"
  DB_DATABASE="${DB_DATABASE:-dream_home_11}"
  export PGPASSWORD="${DB_PASSWORD}"
  DATABASE_URL="postgresql://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}"
fi

echo "=== Restore Preview ==="
echo "Backup file: ${BACKUP_FILE}"
FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "File size: ${FILE_SIZE}"
echo "Target database: ${DB_DATABASE} on ${DB_HOST}:${DB_PORT}"
echo ""
echo "WARNING: This will DROP all existing data in the target database!"
echo ""

read -r -p "Are you sure you want to proceed? (yes/N): " CONFIRM
if [ "${CONFIRM}" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo ""
echo "Step 1: Dropping existing connections to ${DB_DATABASE}..."
psql "${DATABASE_URL}" -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_DATABASE}' AND pid <> pg_backend_pid();" 2>/dev/null || true

echo "Step 2: Restoring database from backup..."

if [[ "${BACKUP_FILE}" == *.gz ]]; then
  gunzip -c "${BACKUP_FILE}" | psql "${DATABASE_URL}"
else
  psql "${DATABASE_URL}" < "${BACKUP_FILE}"
fi

echo ""
echo "Restore completed successfully!"
logger -t "restore.sh" "Database restore completed from ${BACKUP_FILE}"
