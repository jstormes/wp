# WordPress Docker Quick Start

WordPress Quick Start to build on anything from a Raspberry Pi to a NUC.

This project provides a complete WordPress development environment using Docker, including:

- **WordPress** - The WordPress application with Apache
- **MySQL 8.0** - Database server for WordPress
- **Nginx Proxy Manager** - Reverse proxy with SSL certificate management

## Prerequisites

- Docker and Docker Compose installed
- Ports 80, 81, 443, and 8080 available on your host

## Quick Start

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd wp
   ```

2. Create your environment file:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your own values (especially passwords for production use).

4. Start the containers:
   ```bash
   docker-compose up -d
   ```

5. Access the services:
   - **WordPress**: http://localhost:8080
   - **Nginx Proxy Manager**: http://localhost:81
     - Default login: `admin@example.com` / `changeme`

## Configuration

All configuration is done through environment variables in the `.env` file. See `.env.example` for documentation on each variable.

| Variable | Description |
|----------|-------------|
| `WORDPRESS_DB_USER` | MySQL user for WordPress |
| `WORDPRESS_DB_PASSWORD` | Password for the WordPress database user |
| `WORDPRESS_DB_NAME` | Name of the WordPress database |
| `MYSQL_ROOT_PASSWORD` | Root password for MySQL administration |
| `TZ` | Timezone for Nginx Proxy Manager |

## Directory Structure

```
.
├── .docker/                 # Dockerfiles for custom images
│   └── WordPress.Dockerfile # Custom WordPress image
├── .env                     # Environment variables (do not commit)
├── .env.example             # Environment variable template
├── docker-compose.yml       # Docker Compose configuration
├── wordpress/               # WordPress files (mounted volume)
├── wordpress-db/            # MySQL data (mounted volume)
├── npm/                     # Nginx Proxy Manager data
│   ├── data/
│   └── letsencrypt/
└── logs/                    # Container logs (for troubleshooting)
    ├── wordpress/           # Apache access/error logs
    ├── mysql/               # MySQL logs
    └── npm/                 # Nginx Proxy Manager logs
```

## Backup and Restore

Backup and restore scripts are provided:

- `backup.sh` - Creates a backup of WordPress files and database
- `restore.sh` - Restores from a backup
- `fix-permissions.sh` - Fixes file ownership after restore (run with sudo)

See `docker-backup-guide.md` for detailed backup/restore instructions.

## Stopping the Environment

```bash
docker-compose down
```

To also remove the volumes (warning: deletes all data):
```bash
docker-compose down -v
```

## Production Deployment & Security Hardening

### Initial Setup

During initial setup, ports 8080 (WordPress direct) and 81 (NPM admin) are exposed for configuration. This allows you to:

1. Access WordPress directly at http://localhost:8080 to complete installation
2. Access NPM admin at http://localhost:81 to configure your proxy and SSL

### Security Hardening (Required for Production)

**After completing initial configuration**, you must secure these ports:

1. **Change all default passwords** in `.env`:
   - `WORDPRESS_DB_PASSWORD` - Use a strong, unique password
   - `MYSQL_ROOT_PASSWORD` - Use a strong, unique password
   - Change the NPM admin password from `changeme`

2. **Secure exposed ports** in `docker-compose.yml`:

   Remove or comment out the WordPress direct access port:
   ```yaml
   # ports:
   #   - 8080:80
   ```

   Bind NPM admin to localhost only (accessible via SSH tunnel):
   ```yaml
   ports:
     - '80:80'
     - '127.0.0.1:81:81'  # Admin only accessible locally
     - '443:443'
   ```

3. **Restart containers** to apply changes:
   ```bash
   docker compose down && docker compose up -d
   ```

### Accessing NPM Admin After Hardening

Once port 81 is bound to localhost, use an SSH tunnel to access the admin interface:

```bash
ssh -L 8181:localhost:81 user@your-server
```

Then access NPM admin at http://localhost:8181

### Additional Recommendations

- Configure Nginx Proxy Manager with your domain and SSL certificates
- Set up regular backups using the provided scripts
- Restrict `wp-admin` access to local network (see `docker-backup-guide.md`)
- Keep Docker images updated regularly
