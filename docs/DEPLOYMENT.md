# Deployment Guide

This guide covers deploying Aliento Pay to production environments.

## Vercel Deployment (Recommended)

Aliento Pay is optimized for deployment on Vercel with zero configuration.

### Prerequisites

- Vercel account ([sign up free](https://vercel.com/signup))
- GitHub repository connected to Vercel
- Environment variables ready

### Quick Deploy

#### Option 1: GitHub Integration (Recommended)

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Astro configuration

3. **Configure Environment Variables:**
   Add these in Vercel dashboard under Settings → Environment Variables:

   ```env
   WAX_RPC_URL=https://api.hive.blog
   WAX_CHAIN_ID=beeab0de00000000000000000000000000000000000000000000000000000000
   SESSION_SECRET=<your-secure-random-secret>
   NODE_ENV=production
   ```

4. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Get your production URL: `https://your-project.vercel.app`

#### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add WAX_RPC_URL
vercel env add WAX_CHAIN_ID
vercel env add SESSION_SECRET
vercel env add NODE_ENV

# Deploy to production
vercel --prod
```

### Automatic Deployments

Once connected, Vercel automatically deploys:
- **Production:** Pushes to `main` branch
- **Preview:** Pushes to any other branch
- **Pull Requests:** Each PR gets a unique preview URL

### Custom Domain

1. **Add Domain in Vercel:**
   - Dashboard → Project → Settings → Domains
   - Enter your domain name
   - Follow DNS configuration instructions

2. **Configure DNS:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **SSL Certificate:**
   - Automatically provisioned by Vercel
   - Enabled by default

---

## Node.js Server Deployment

For custom Node.js hosting (DigitalOcean, AWS, etc.).

### Prerequisites

- Node.js 18+ installed
- PM2 or systemd for process management
- Nginx for reverse proxy
- SSL certificate (Let's Encrypt)

### Build Steps

```bash
# 1. Clone repository
git clone <repository-url>
cd aliento-pay

# 2. Install dependencies
npm ci --production

# 3. Set environment variables
cp .env.example .env
nano .env  # Edit with production values

# 4. Build application
npm run build

# 5. Preview (optional)
npm run preview
```

### PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'aliento-pay',
    script: 'node_modules/.bin/astro',
    args: 'preview',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Start with PM2:

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Nginx Configuration

Create `/etc/nginx/sites-available/aliento-pay`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/aliento-pay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Docker Deployment

### Dockerfile

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  aliento-pay:
    build: .
    ports:
      - "3000:3000"
    environment:
      - WAX_RPC_URL=${WAX_RPC_URL}
      - WAX_CHAIN_ID=${WAX_CHAIN_ID}
      - SESSION_SECRET=${SESSION_SECRET}
      - NODE_ENV=production
    restart: unless-stopped
```

Deploy:

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `WAX_RPC_URL` | Hive RPC endpoint | `https://api.hive.blog` |
| `WAX_CHAIN_ID` | Hive blockchain ID | `beeab0de...` |
| `SESSION_SECRET` | Session encryption key | Random 32-byte hex |
| `NODE_ENV` | Environment mode | `production` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `API_RATE_LIMIT` | Rate limit per window | `100` |
| `API_RATE_WINDOW` | Rate limit window | `15m` |

### Generating Secrets

```bash
# SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Health Checks

### Endpoint

```
GET /api/health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T12:00:00Z",
  "uptime": 3600,
  "environment": "production"
}
```

### Docker Health Check

Add to `Dockerfile`:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
```

---

## Performance Optimization

### Enable Caching

```nginx
# Nginx cache configuration
location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Enable Compression

```nginx
# Nginx gzip configuration
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
gzip_comp_level 6;
```

### CDN Integration

Use Vercel Edge Network (automatic) or configure CDN:

```nginx
# CloudFlare example
proxy_set_header CF-Connecting-IP $remote_addr;
real_ip_header CF-Connecting-IP;
```

---

## Monitoring

### Vercel Analytics

Enabled automatically in Vercel deployments:
- Real-time visitor tracking
- Performance metrics
- Error tracking

### Custom Monitoring

```bash
# PM2 monitoring
pm2 monit

# PM2 web dashboard
pm2 web
```

### Application Logs

```bash
# Vercel logs
vercel logs

# PM2 logs
pm2 logs aliento-pay

# Docker logs
docker-compose logs -f aliento-pay
```

---

## Backup & Recovery

### Environment Backup

```bash
# Export environment variables
vercel env pull .env.production

# Backup to secure location
cp .env.production ~/backups/aliento-pay-env-$(date +%Y%m%d).env
```

### Database Backup

No database required (stateless architecture). User data stored on Hive blockchain.

---

## Rollback Strategy

### Vercel Rollback

1. Go to Deployments tab
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

### Manual Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push -f origin main
```

---

## Security Checklist

- [ ] Environment variables set securely
- [ ] SESSION_SECRET is strong and unique
- [ ] HTTPS enabled (SSL certificate)
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies updated (npm audit)
- [ ] Firewall rules configured
- [ ] Backup strategy in place

---

## Troubleshooting

### Build Failures

```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### SSL Certificate Issues

```bash
# Verify certificate
openssl s_client -connect your-domain.com:443

# Force renewal
sudo certbot renew --force-renewal
```

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

Need help? Open an issue on GitHub or check our [Getting Started Guide](./GETTING_STARTED.md).
