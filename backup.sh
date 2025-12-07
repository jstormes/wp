#!/bin/bash
set -e
source .env

BACKUP_DIR="./backup"
DATE=$(date +%F)
NPM_STOPPED=false

# Ensure NPM is restarted on exit, error, or interrupt
cleanup() {
    if [ "$NPM_STOPPED" = true ]; then
        echo "Restarting NPM..."
        docker compose start npm
    fi
}
trap cleanup EXIT

mkdir -p "$BACKUP_DIR"

# Docker config files
echo "Backing up Docker config..."
tar czf "$BACKUP_DIR/docker-config-$DATE.tar.gz" docker-compose.yml .env

# WordPress Database
echo "Backing up WordPress database..."
docker compose exec -T wordpress-db mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" "$WORDPRESS_DB_NAME" | gzip > "$BACKUP_DIR/db-$DATE.sql.gz"

# WordPress Files
echo "Backing up WordPress files..."
tar czf "$BACKUP_DIR/wp-files-$DATE.tar.gz" ./wordpress

# Nginx Proxy Manager (stop for clean SQLite backup)
echo "Stopping NPM for backup..."
docker compose stop npm
NPM_STOPPED=true

echo "Backing up NPM..."
tar czf "$BACKUP_DIR/npm-$DATE.tar.gz" ./npm

echo "Starting NPM..."
docker compose start npm
NPM_STOPPED=false

# Cleanup old backups
find "$BACKUP_DIR" -type f -mtime +30 -delete

echo "Backup complete: $DATE"