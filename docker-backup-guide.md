# Docker WordPress Backup & Restore Guide

## Overview

This guide covers backing up and restoring a Dockerized WordPress installation with Nginx Proxy Manager.

## Security Notice

This setup exposes ports for initial configuration that **must be secured before production deployment**. See the "Security Hardening" section in README.md for details.

**Ports exposed during setup:**
- Port 8080: WordPress direct access (bypasses proxy)
- Port 81: NPM admin interface

**After configuration, you should:**
1. Remove or bind port 8080 to localhost
2. Bind port 81 to localhost (use SSH tunnel for access)
3. Change all default passwords

## Components Backed Up

- WordPress MySQL database
- WordPress files (themes, plugins, uploads)
- Nginx Proxy Manager configuration and SSL certificates
- Docker Compose configuration files

---

## Setup

### .env File

Store credentials securely in a `.env` file:

```bash
WORDPRESS_DB_USER=wordpressuser
WORDPRESS_DB_PASSWORD=your_secure_password
WORDPRESS_DB_NAME=wordpress
MYSQL_ROOT_PASSWORD=your_secure_root_password
TZ=America/Chicago
```

Secure it:

```bash
chmod 600 .env
```

### docker-compose.yml

```yaml
services:
  wordpress:
    build:
      context: .
      dockerfile: .docker/WordPress.Dockerfile
    restart: always
    ports:
      - 8080:80
    environment:
      WORDPRESS_DB_HOST: wordpress-db
      WORDPRESS_DB_USER: ${WORDPRESS_DB_USER}
      WORDPRESS_DB_PASSWORD: ${WORDPRESS_DB_PASSWORD}
      WORDPRESS_DB_NAME: ${WORDPRESS_DB_NAME}
    volumes:
      - ./wordpress:/var/www/html

  wordpress-db:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_DATABASE: ${WORDPRESS_DB_NAME}
      MYSQL_USER: ${WORDPRESS_DB_USER}
      MYSQL_PASSWORD: ${WORDPRESS_DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
    volumes:
      - ./wordpress-db:/var/lib/mysql

  npm:
    image: jc21/nginx-proxy-manager:latest
    restart: unless-stopped
    environment:
      TZ: ${TZ}
    ports:
      - "80:80"
      - "81:81"
      - "443:443"
    volumes:
      - ./npm/data:/data
      - ./npm/letsencrypt:/etc/letsencrypt
```

---

## Backup Script

**backup.sh:**

```bash
#!/bin/bash
set -e
source .env

BACKUP_DIR="./backup"
DATE=$(date +%F)
NPM_STOPPED=false
UPDATE_IMAGES=${1:-false}  # Pass 'update' as argument to update images

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

# Update Docker images if requested
if [ "$UPDATE_IMAGES" = "update" ]; then
    echo "Pulling latest Docker images..."
    docker compose pull

    echo "Recreating containers with new images..."
    docker compose up -d

    echo "Cleaning up old images..."
    docker image prune -f

    echo "Update complete!"
fi
```

### Backup Usage

```bash
# Backup only
./backup.sh

# Backup and update Docker images
./backup.sh update
```

---

## Restore Script

**restore.sh:**

```bash
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
```

### Restore Usage

**Critical:** The `.env` file **must** be restored before starting any containers. If containers start without proper environment variables, the database will be created with empty credentials and will need to be deleted and recreated.

If you've lost your `.env` file, restore it from the docker-config backup **before** running docker compose:

```bash
# 1. Stop any running containers
docker compose down

# 2. Extract docker config (includes .env and docker-compose.yml)
tar xzf backup/docker-config-YYYY-MM-DD.tar.gz

# 3. Now run the restore script
./restore.sh YYYY-MM-DD
```

Then run the restore:

```bash
# List available backups
./restore.sh

# Restore everything
./restore.sh 2025-12-07

# Restore only WordPress
./restore.sh 2025-12-07 --wp-only

# Restore only NPM
./restore.sh 2025-12-07 --npm-only
```

### Fixing Permissions After Restore

After restoring from backup, file ownership may not match what the Docker containers expect. Run the fix-permissions script to correct this:

```bash
sudo ./fix-permissions.sh
```

This sets the correct ownership:
- `wordpress/` → UID 33:33 (www-data)
- `wordpress-db/` → UID 999:0 (mysql)
- `npm/` → UID 0:0 (root)

---

## User & Permission Setup

### Add Backup User to Docker Group

```bash
sudo usermod -aG docker backup
```

### File Permissions

```bash
# Set ownership
chown backup:backup backup.sh restore.sh .env

# Scripts: readable and executable by owner only
chmod 700 backup.sh restore.sh

# .env: readable by owner only (contains secrets)
chmod 600 .env

# Backup directory: owned by backup user
mkdir -p ./backup
chown backup:backup ./backup
chmod 700 ./backup
```

### WordPress and NPM Directory Permissions

```bash
chown -R docker:docker ./wordpress ./npm
chmod -R g+r ./wordpress ./npm
usermod -aG docker backup
```

### Permissions Summary

| File/Directory | Owner         | Permissions | Notes                      |
|----------------|---------------|-------------|----------------------------|
| `backup.sh`    | backup:backup | 700         | Execute only by owner      |
| `restore.sh`   | backup:backup | 700         | Execute only by owner      |
| `.env`         | backup:backup | 600         | Read only by owner         |
| `./backup/`    | backup:backup | 700         | Backup files directory     |
| `./wordpress/` | docker:docker | 755         | WordPress needs docker access |
| `./npm/`       | docker:docker | 755         | NPM needs docker access    |

---

## Cron Setup

### Create Log File

```bash
sudo touch /var/log/backup.log
sudo chown backup:backup /var/log/backup.log
chmod 640 /var/log/backup.log
```

### Edit Crontab

```bash
sudo crontab -u backup -e
```

### Crontab Entries

```cron
# Daily backup at 2:30 AM
30 2 * * * cd /path/to/your/docker/project && ./backup.sh >> /var/log/backup.log 2>&1

# Weekly backup with image update on Sunday at 3 AM
0 3 * * 0 cd /path/to/your/docker/project && ./backup.sh update >> /var/log/backup-weekly.log 2>&1
```

---

## Testing

### Test Backup as Backup User

```bash
sudo -u backup ./backup.sh
```

### Verify Backup Files

```bash
ls -la ./backup/
```

---

## Offsite Backup Recommendations

Consider syncing backups offsite using:

- `rclone` to S3, Backblaze B2, Google Drive, etc.
- `rsync` to another server
- `restic` for encrypted, deduplicated backups

Example rclone sync:

```bash
rclone sync ./backup remote:backups/wordpress
```

---

## Restricting wp-admin to Local Network

Protect your WordPress admin area by allowing access only from your local network.

### Option 1: NPM Access Lists (Recommended)

This is the easiest method and is managed through the NPM UI.

1. Go to **Access Lists** → **Add Access List**
2. Name it "Local Network Only"
3. Under the **Access** tab, add:
   - `allow 192.168.0.0/16` (or your specific local subnet)
   - `allow 10.0.0.0/8`
   - `deny all`
4. Save

Then edit your WordPress proxy host:

1. Go to **Hosts** → **Proxy Hosts** → Edit your WordPress host
2. Go to the **Custom locations** tab
3. Add a new location:
   - Location: `/wp-admin`
   - Forward Hostname/IP: same as main
   - Forward Port: same as main
   - Select your "Local Network Only" access list
4. Add another location for `/wp-login.php`

### Option 2: NPM Custom Nginx Config

Edit your WordPress proxy host in NPM and go to the **Advanced** tab. Add:

```nginx
# Restrict wp-admin and wp-login to local network
location /wp-admin {
    allow 192.168.0.0/16;
    allow 10.0.0.0/8;
    allow 172.16.0.0/12;
    deny all;
    
    proxy_pass http://wordpress:80;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location = /wp-login.php {
    allow 192.168.0.0/16;
    allow 10.0.0.0/8;
    allow 172.16.0.0/12;
    deny all;
    
    proxy_pass http://wordpress:80;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Adjust the `proxy_pass` to match your WordPress container name.

### Option 3: WordPress .htaccess

Add to your `wordpress/.htaccess`:

```apache
<Files wp-login.php>
    Order Deny,Allow
    Deny from all
    Allow from 192.168.0.0/16
    Allow from 10.0.0.0/8
</Files>

<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REMOTE_ADDR} !^192\.168\.
    RewriteCond %{REMOTE_ADDR} !^10\.
    RewriteRule ^wp-admin - [F,L]
</IfModule>
```

### Important: Real IP Forwarding

For any of these methods to work correctly, NPM needs to pass the real client IP to WordPress.

Ensure your WordPress proxy host has these headers set (usually default in NPM):

```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

Add this to WordPress `wp-config.php` so WordPress sees the real client IP:

```php
if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $_SERVER['REMOTE_ADDR'] = $_SERVER['HTTP_X_FORWARDED_FOR'];
}
```

---

## Troubleshooting

### Permission Denied on Docker Commands

Ensure the backup user is in the docker group and has logged out/in:

```bash
groups backup  # Should show 'docker'
```

### NPM Not Restarting After Failed Backup

The cleanup trap should handle this, but you can manually restart:

```bash
docker compose start npm
```

### Database Restore Fails

Ensure MySQL is fully ready before restoring:

```bash
docker compose logs wordpress-db
```

---

## Fail2ban Configuration

Fail2ban can protect your WordPress installation from brute-force login attacks by monitoring logs and banning IPs that show malicious behavior.

### Installing Fail2ban on Host

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install fail2ban

# Start and enable
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### WordPress Jail Configuration

Create `/etc/fail2ban/jail.d/wordpress.conf`:

```ini
[wordpress]
enabled = true
port = http,https
filter = wordpress
logpath = /path/to/your/wp/logs/npm/proxy-host-*_access.log
maxretry = 5
findtime = 600
bantime = 3600
```

### WordPress Filter

Create `/etc/fail2ban/filter.d/wordpress.conf`:

```ini
[Definition]
failregex = ^<HOST> .* "POST /wp-login.php
            ^<HOST> .* "POST /xmlrpc.php
ignoreregex =
```

### Testing and Managing Fail2ban

```bash
# Test filter against logs
sudo fail2ban-regex /path/to/logs/npm/proxy-host-*_access.log /etc/fail2ban/filter.d/wordpress.conf

# Check jail status
sudo fail2ban-client status wordpress

# Unban an IP
sudo fail2ban-client set wordpress unbanip 192.168.1.100

# View banned IPs
sudo fail2ban-client status wordpress
```

### Important Notes

- Adjust `logpath` to match your actual log location
- The logs are in the `./logs/npm/` directory
- Fail2ban runs on the host, not in a container
- Ensure NPM is configured to log the real client IP (see "Real IP Forwarding" section)

---

## WordPress Security Plugins

### Recommended Security Plugins

| Plugin | Purpose | Notes |
|--------|---------|-------|
| **Wordfence Security** | Firewall, malware scanner, login security | Most comprehensive free option |
| **Limit Login Attempts Reloaded** | Brute-force protection | Lightweight, works with fail2ban |
| **WP Hide & Security Enhancer** | Hide WordPress fingerprints | Obscures wp-admin, wp-login paths |
| **UpdraftPlus** | Backup to cloud storage | Complements local backup scripts |
| **Two Factor** | 2FA for wp-admin | Adds TOTP authentication |

### Wordfence Configuration

After installing Wordfence:

1. **Enable Firewall**: Go to Wordfence → Firewall → Manage Firewall
   - Set to "Enabled and Protecting"
   - Enable "Rate Limiting"

2. **Configure Login Security**:
   - Wordfence → Login Security
   - Enable Two-Factor Authentication
   - Set "Lock out after how many login failures" to 5
   - Set "Lock out for how long" to 1 hour

3. **Enable Brute Force Protection**:
   - Wordfence → All Options → Brute Force Protection
   - Enable "Enforce strong passwords"
   - Enable "Prevent discovery of usernames"

4. **Configure Scanning**:
   - Wordfence → Scan
   - Run initial scan
   - Set up scheduled scans (weekly recommended)

### Disable XML-RPC (If Not Needed)

XML-RPC is a common attack vector. If you don't use it (mobile apps, Jetpack, etc.), disable it:

**Option 1: Via .htaccess**

Add to `wordpress/.htaccess`:

```apache
<Files xmlrpc.php>
    Order Deny,Allow
    Deny from all
</Files>
```

**Option 2: Via Plugin**

Install "Disable XML-RPC" plugin.

**Option 3: Via wp-config.php**

Add to `wordpress/wp-config.php`:

```php
add_filter('xmlrpc_enabled', '__return_false');
```

### Security Checklist

- [ ] Change default `admin` username
- [ ] Use strong passwords (12+ characters, mixed case, numbers, symbols)
- [ ] Enable Two-Factor Authentication
- [ ] Keep WordPress, themes, and plugins updated
- [ ] Remove unused themes and plugins
- [ ] Disable file editing in wp-admin (add to wp-config.php):
  ```php
  define('DISALLOW_FILE_EDIT', true);
  ```
- [ ] Set correct file permissions (755 for directories, 644 for files)
- [ ] Configure automatic updates for minor releases
- [ ] Monitor security scan results regularly
- [ ] Review user accounts and remove inactive users
