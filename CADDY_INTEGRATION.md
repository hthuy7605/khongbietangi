# Integration Guide for Existing Docker Compose Setup

This guide shows how to integrate khongbietangi into your existing docker-compose.yml with Caddy.

**Note:** Following the same pattern, the frontend is built locally and served directly by Caddy (no Docker container needed for frontend).

## Step 1: Add Backend Service to Your docker-compose.yml

Add only the backend service to your existing docker-compose.yml:

```yaml
  # --- KHONGBIETANGI (Backend) ---
  khongbietangi_backend:
    build: ./khongbietangi/backend
    container_name: khongbietangi_backend
    restart: unless-stopped
    env_file:
      - ./khongbietangi/backend/.env.production
    environment:
      - DB_HOST=
      - DB_PORT=
      - DB_NAME=
      - DB_USER=
      - DB_PASSWORD=
      - PORT=
    depends_on:
      - postgres_db
    networks:
      - server_network
```

## Step 2: Update Caddyfile

Add this configuration to your Caddyfile (adjust domain/subdomain as needed):

```caddyfile
# --- khongbietangi ---
khongbietangi.com, www.khongbietangi.com {
    # Proxy API requests to backend
    handle /api/* {
        reverse_proxy khongbietangi_backend:5000
    }
    handle {
        root * /srv/khongbietangi
        file_server
        try_files {path} /index.html
    }

    #Gzip compression
    encode gzip
}
```

**Important:**
1. The `reverse_proxy` with `@api` matcher must come BEFORE `file_server`
2. The root path must be `/srv/khongbietangi/dist` (not `/srv/khongbietangi`)
3. Using `@api` matcher ensures all HTTP methods (POST, PUT, DELETE) are proxied correctly

## Step 3: Update Caddy Volume Mapping

Update the caddy service in your docker-compose.yml to include the khongbietangi frontend:

```yaml
  caddy:
    image: caddy:alpine
    container_name: caddy_proxy
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
      - ./thayThuanChuyenToan/FE-thayThuanChuyenToan/dist:/srv/thayThuanChuyenToan
      - ./khongbietangi/frontend/dist:/srv/khongbietangi  # Add this line
    networks:
      - server_network
```

## Step 4: Setup Database

Create the database and tables in your existing PostgreSQL:

```sql
-- Connect to PostgreSQL
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

## Step 5: Update Backend .env.production

Update `khongbietangi/backend/.env.production`:

```env
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=
DB_NAME=
PORT=
```

## Step 6: Initial Deploy

```bash
# Build and start the backend service
cd /opt/server
docker compose up -d --build khongbietangi_backend

# Build frontend locally
cd /opt/server/khongbietangi/frontend
npm install
npm run build

# Restart Caddy to pick up new configuration
cd /opt/server
docker compose restart caddy

# Check logs
docker compose logs -f khongbietangi_backend
```

## Step 7: Using deploy.sh

Use the provided deploy.sh script for future deployments:

```bash
cd /opt/server/khongbietangi
./deploy.sh
```

Options:
- 1) Chỉ Frontend (build local, Caddy serve)
- 2) Chỉ Backend
- 3) Tất cả (Frontend + Backend)

## Alternative: Using Subdirectory

If you want to serve khongbietangi under a subdirectory (e.g., your-domain.com/food):

```caddyfile
your-domain.com {
    # Existing configuration for thayThuanChuyenToan
    root * /srv/thayThuanChuyenToan/dist
    file_server
    try_files {path} /index.html

    # Khongbietangi under /food subdirectory
    handle /food/* {
        root * /srv/khongbietangi/dist
        file_server
        try_files {path} /index.html
    }

    # Proxy API requests
    handle /api/food/* {
        reverse_proxy khongbietangi_backend:5000
    }

    encode gzip
}
```

You'll also need to update the frontend's `vite.config.js` to build with the base path:

```javascript
export default defineConfig({
  base: '/food/',
  // ... rest of config
})
```

And update the frontend API calls to use the correct path.
