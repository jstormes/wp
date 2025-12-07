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
└── npm/                     # Nginx Proxy Manager data
    ├── data/
    └── letsencrypt/
```

## Backup and Restore

Backup and restore scripts are provided:

- `backup.sh` - Creates a backup of WordPress files and database
- `restore.sh` - Restores from a backup

See `docker-backup-guide.md` for detailed backup/restore instructions.

## Stopping the Environment

```bash
docker-compose down
```

To also remove the volumes (warning: deletes all data):
```bash
docker-compose down -v
```

## Production Considerations

Before deploying to production:

1. Change all default passwords in `.env`
2. Configure Nginx Proxy Manager with your domain and SSL certificates
3. Set up regular backups using the provided scripts
4. Consider adding resource limits to the containers
