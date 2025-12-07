#!/bin/bash
set -e
source .env

BACKUP_DIR="./backup"

if [ -z "$1" ]; then
    echo "Available backups:"
    ls -1 "$BACKUP_DIR"/db-*.sql.gz 2>/dev/null | sed 's/.*db-\(.*\)\.sql\.gz/\1/'
    echo ""
    echo "Usage: $0 <date> [--wp-only|--npm-only|--all]"
    exit 1
fi

DATE=$1
RESTORE_TARGET=${2:---all}

DB_BACKUP="$BACKUP_DIR/db-$DATE.sql.gz"
WP_BACKUP="$BACKUP_DIR/wp-files-$DATE.tar.gz"
NPM_BACKUP="$BACKUP_DIR/npm-$DATE.tar.gz"

echo "Restoring from: $DATE"
read -p "Continue? (yes/no): " CONFIRM
[ "$CONFIRM" != "yes" ] && echo "Cancelled." && exit 0

if [ "$RESTORE_TARGET" = "--all" ] || [ "$RESTORE_TARGET" = "--wp-only" ]; then
    echo "Restoring WordPress files..."
    tar xzf "$WP_BACKUP" -C .

    echo "Recreating database..."
    docker compose down wordpress-db
    docker volume rm $(docker compose config --volumes | grep db_data) 2>/dev/null || true
    docker compose up -d wordpress-db

    echo "Waiting for MySQL..."
    until docker compose exec -T wordpress-db mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1" &>/dev/null; do
        sleep 2
    done

    echo "Restoring database..."
    gunzip -c "$DB_BACKUP" | docker compose exec -T wordpress-db mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$WORDPRESS_DB_NAME"
fi

if [ "$RESTORE_TARGET" = "--all" ] || [ "$RESTORE_TARGET" = "--npm-only" ]; then
    echo "Restoring Nginx Proxy Manager..."
    docker compose stop npm
    tar xzf "$NPM_BACKUP" -C .
    docker compose up -d npm
fi

docker compose up -d

echo "Restore complete!"
