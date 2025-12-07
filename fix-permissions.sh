#!/bin/bash
#############################################################################
# Fix Permissions Script
#
# Restores the correct ownership and permissions for Docker volume directories
# after a restore operation. This is necessary because backup archives may
# preserve the original user's ownership rather than the container UIDs.
#
# Usage:
#   sudo ./fix-permissions.sh
#
# The script must be run with sudo/root privileges.
#############################################################################

set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "This script must be run as root (use sudo)"
    exit 1
fi

echo "Fixing permissions for Docker volumes..."

# WordPress: owned by www-data (UID 33, GID 33)
if [ -d "./wordpress" ]; then
    echo "Setting wordpress/ ownership to UID 33:33 (www-data)..."
    chown -R 33:33 ./wordpress
fi

# MySQL: owned by mysql user in container (UID 999, GID 0)
if [ -d "./wordpress-db" ]; then
    echo "Setting wordpress-db/ ownership to UID 999:0 (mysql)..."
    chown -R 999:0 ./wordpress-db
fi

# Nginx Proxy Manager: owned by root (UID 0, GID 0)
if [ -d "./npm" ]; then
    echo "Setting npm/ ownership to UID 0:0 (root)..."
    chown -R 0:0 ./npm
fi

# Logs: owned by root (containers write as root)
if [ -d "./logs" ]; then
    echo "Setting logs/ ownership to UID 0:0 (root)..."
    chown -R 0:0 ./logs
fi

echo "Permissions fixed successfully!"
