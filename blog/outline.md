# Self-Host WordPress on a Raspberry Pi with Docker

## Outline

### I. Introduction
- Hook: You don't need expensive hosting to run WordPress
- What we're building: WordPress + MySQL + Nginx Proxy Manager
- Target audience: hobbyists, developers, learners
- End result: secure, self-hosted WordPress with backups

### II. Why Self-Host?
- Learning opportunity (Docker, Linux, networking)
- Full control over your data and server
- Cost savings (hardware vs monthly hosting fees)
- Privacy

### III. Prerequisites
- Hardware (Raspberry Pi 5 8GB+, NUC, or spare computer)
- Docker and Docker Compose installed
- Domain name
- Router port forwarding (80, 443)

### IV. The Stack Overview
- Diagram or table of the three containers
- How they communicate (internal Docker network)
- Why Nginx Proxy Manager (SSL, reverse proxy, web UI)

### V. Project Setup
- Directory structure
- Environment variables (.env)
- docker-compose.yml walkthrough
- Key configuration decisions explained

### VI. Initial Configuration
- Starting the stack
- WordPress installation wizard
- NPM setup and default credentials
- Configuring your domain with SSL

### VII. Security Hardening
- Removing exposed ports (8080, 81)
- SSH tunnel for NPM admin access
- Recommended WordPress security plugins
- Security checklist

### VIII. Backup Strategy
- What gets backed up (database, files, config, logs)
- The backup script explained
- Scheduling with cron
- Restore process overview

### IX. Monitoring and Maintenance
- Checking container health
- Viewing logs
- Updating containers
- Disk usage

### X. Troubleshooting
- Common issues and solutions
- Database connection problems
- SSL certificate issues
- Performance on low-power hardware

### XI. Conclusion
- Recap what we built
- What you learned
- Link to GitHub repo
- Call to action / next steps
