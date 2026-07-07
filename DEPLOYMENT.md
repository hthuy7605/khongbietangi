# Deployment Guide for VPS

This guide will help you deploy the "Không biết ăn gì" application to your VPS using Docker.

## Prerequisites

- VPS with SSH access
- Docker and Docker Compose installed on VPS
- PostgreSQL database (already have one)
- Domain name (optional, for SSL)

## Step 1: Prepare Your VPS

### Install Docker and Docker Compose (if not already installed)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add your user to docker group (optional)
sudo usermod -aG docker $USER
```

## Step 2: Prepare Database

Make sure your PostgreSQL database is accessible from your VPS. You need to:

1. Ensure PostgreSQL allows remote connections
2. Create the database and users table if not exists

```sql
-- Connect to your PostgreSQL
CREATE DATABASE khongbietangi;

-- Connect to the database
\c khongbietangi

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert admin user
INSERT INTO users (username, password) 
VALUES ('', '')
ON CONFLICT (username) DO NOTHING;

-- Create monAn table
CREATE TABLE IF NOT EXISTS monAn (
    id SERIAL PRIMARY KEY,
    district VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    priority INTEGER DEFAULT 0
);
```

## Step 3: Upload Files to VPS

### Option A: Using Git (Recommended)

```bash
# On your local machine
git init
git add .
git commit -m "Initial commit"

# Create repository on GitHub/GitLab and push
git remote add origin <your-repo-url>
git push -u origin main

# On VPS
git clone <your-repo-url> /var/www/khongbietangi
cd /var/www/khongbietangi
```

### Option B: Using SCP

```bash
# On your local machine
scp -r . user@your-vps-ip:/var/www/khongbietangi
```

## Step 4: Configure Environment Variables

Edit the production environment file:

```bash
cd /var/www/khongbietangi/backend
nano .env.production
```

Update with your actual database credentials:

```env
DB_USER=your_actual_db_user
DB_PASSWORD=your_actual_db_password
DB_HOST=your_postgresql_host_or_ip
DB_PORT=5432
DB_NAME=khongbietangi
PORT=5000
```

## Step 5: Build and Start Containers

```bash
cd /var/www/khongbietangi

# Build and start all services
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Check running containers
docker-compose ps
```

## Step 6: Configure Firewall

```bash
# Allow HTTP traffic
sudo ufw allow 80/tcp

# Allow HTTPS (if using SSL)
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

## Step 7: (Optional) Set up SSL with Let's Encrypt

### Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Obtain SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com
```

### Auto-renewal

```bash
sudo certbot renew --dry-run
```

Certbot will automatically set up auto-renewal.

## Step 8: Useful Commands

### View logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart services
```bash
docker-compose restart
```

### Stop services
```bash
docker-compose down
```

### Update application
```bash
cd /var/www/khongbietangi
git pull
docker-compose up -d --build
```

### Backup database
```bash
pg_dump -h your_db_host -U your_db_user khongbietangi > backup.sql
```

## Troubleshooting

### Backend can't connect to database
- Check database credentials in `.env.production`
- Ensure PostgreSQL allows remote connections
- Check firewall rules on database server

### Frontend shows 502 error
- Check if backend container is running: `docker-compose ps`
- Check backend logs: `docker-compose logs backend`
- Ensure backend healthcheck is passing

### Port 80 already in use
- Stop other services using port 80
- Or change the port mapping in `docker-compose.yml`:
  ```yaml
  ports:
    - "8080:80"
  ```

## Security Recommendations

1. Use strong passwords for database
2. Enable SSL/HTTPS
3. Keep Docker and system updated
4. Use a firewall
5. Regular database backups
6. Consider using secrets management for sensitive data
7. Limit database user permissions

## Monitoring

Consider setting up monitoring tools like:
- Prometheus + Grafana
- Uptime monitoring (UptimeRobot, Pingdom)
- Log aggregation (ELK stack, Loki)

## Support

If you encounter issues:
1. Check container logs: `docker-compose logs`
2. Verify database connectivity
3. Check firewall rules
4. Ensure all environment variables are set correctly
