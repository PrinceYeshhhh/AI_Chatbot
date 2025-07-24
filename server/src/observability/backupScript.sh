#!/bin/bash
# Daily backup script for Supabase/Postgres DB to encrypted S3
# (Replace placeholders with actual values)

DB_URL="postgres://user:pass@host:port/db"
BACKUP_FILE="backup_$(date +%F).sql"
S3_BUCKET="s3://your-bucket/backups/"
ENCRYPTION_KEY="your-encryption-key"

# Dump DB
echo "Dumping database..."
pg_dump $DB_URL > $BACKUP_FILE

# Encrypt backup
echo "Encrypting backup..."
openssl enc -aes-256-cbc -salt -in $BACKUP_FILE -out $BACKUP_FILE.enc -k $ENCRYPTION_KEY

# Upload to S3
echo "Uploading to S3..."
aws s3 cp $BACKUP_FILE.enc $S3_BUCKET

# Cleanup
rm $BACKUP_FILE $BACKUP_FILE.enc

echo "Backup complete." 