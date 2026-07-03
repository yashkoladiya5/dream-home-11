#!/bin/bash
set -eo pipefail

SCRIPT_NAME=$(basename "$0")
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

show_help() {
  cat <<EOF
Usage: ${SCRIPT_NAME} [OPTIONS]

PostgreSQL database backup script. Creates timestamped compressed dumps
with optional S3 upload and automatic cleanup of old backups.

Options:
  --s3-bucket BUCKET    Upload backup to S3 bucket after creation
  --compress            Compress backup with gzip (default: enabled)
  --no-upload           Skip S3 upload even if S3_BUCKET is set
  --help                Show this help message and exit

Environment variables:
  DATABASE_URL          Full PostgreSQL connection URL
  DB_HOST               Database host (used if DATABASE_URL not set)
  DB_PORT               Database port (default: 5432)
  DB_USERNAME           Database user
  DB_PASSWORD           Database password
  DB_DATABASE           Database name
  S3_BUCKET             S3 bucket for uploads
  AWS_CLI_PROFILE       AWS CLI profile for S3 uploads
  BACKUP_DIR            Local backup directory (default: ./backups)
  RETENTION_DAYS        Days to keep local backups (default: 7)

Examples:
  ${SCRIPT_NAME}
  ${SCRIPT_NAME} --s3-bucket my-backups
  ${SCRIPT_NAME} --no-upload
  DATABASE_URL=postgres://user:pass@host:5432/db ${SCRIPT_NAME}
EOF
  exit 0
}

S3_BUCKET=""
NO_UPLOAD=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --s3-bucket)
      S3_BUCKET="$2"
      shift 2
      ;;
    --compress)
      shift
      ;;
    --no-upload)
      NO_UPLOAD=true
      shift
      ;;
    --help)
      show_help
      ;;
    *)
      echo "Error: Unknown option $1"
      show_help
      ;;
  esac
done

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

mkdir -p "${BACKUP_DIR}"

DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
FILENAME="backup-${DB_NAME}-${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

echo "Starting backup: ${DB_NAME} -> ${FILEPATH}"

pg_dump "${DATABASE_URL}" --no-owner --clean --if-exists | gzip > "${FILEPATH}"

if [ ! -f "${FILEPATH}" ]; then
  echo "Error: Backup file was not created"
  exit 1
fi

FILE_SIZE=$(du -h "${FILEPATH}" | cut -f1)
echo "Backup complete: ${FILEPATH} (${FILE_SIZE})"

if [ -n "$S3_BUCKET" ] && [ "${NO_UPLOAD}" = false ]; then
  AWS_ARGS=""
  if [ -n "${AWS_CLI_PROFILE}" ]; then
    AWS_ARGS="--profile ${AWS_CLI_PROFILE}"
  fi
  echo "Uploading to s3://${S3_BUCKET}/database/${FILENAME} ..."
  aws s3 cp "${FILEPATH}" "s3://${S3_BUCKET}/database/${FILENAME}" ${AWS_ARGS}
  echo "S3 upload complete"
elif [ "${NO_UPLOAD}" = false ] && [ -n "${S3_BUCKET}" ]; then
  echo "S3 upload configured but --no-upload flag set; skipping"
fi

echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "backup-*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "Backup finished successfully"
logger -t "backup.sh" "Database backup completed: ${FILENAME} (${FILE_SIZE})"
