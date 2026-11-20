# Deployment guide (Report v2.0 section 15)

```
Browser ──HTTPS──► Vercel (React files)            app.example.com
Browser ──HTTPS/WSS──► Nginx (EC2) ──► Node :3000   api.example.com
                                         └──► RDS MySQL (private)
```

Replace `example.com` with your real domain everywhere. **A custom domain with HTTPS is required**:
the Vercel site is HTTPS, and browsers block calls from it to an insecure API or WebSocket.

> The files in `deploy/` and `.github/workflows/` were written to match the report but have **not been
> run on real AWS, Vercel or GitHub in this build**. Expect to adjust names, paths and security groups.

## 1. Database: AWS RDS (MySQL 8)

1. Create an RDS **MySQL 8.0** instance (Free tier or `db.t4g.micro`), **not publicly accessible**, in a VPC with a private subnet group.
2. Turn on **automated backups** (retention at least 7 days).
3. Security group `rds-sg`: allow inbound **3306 only from the EC2 security group** `api-sg`.
4. Create the database and a limited user (connect from the EC2 server):
   ```sql
   CREATE DATABASE smartqr CHARACTER SET utf8mb4;
   CREATE USER 'smartqr_user'@'%' IDENTIFIED BY '<long random password>';
   GRANT ALL ON smartqr.* TO 'smartqr_user'@'%';
   ```

## 2. Backend: AWS EC2

1. Launch Ubuntu 24.04 (`t3.micro` or `t4g.small`) in a **public subnet** with security group `api-sg`: inbound 80 and 443 from anywhere, 22 **only from your IP**.
2. Point the DNS record `api.example.com` (A record) to the instance's Elastic IP.
3. Install the tools:
   ```bash
   sudo apt update && sudo apt install -y nginx git certbot python3-certbot-nginx
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
   sudo npm install -g pm2
   ```
4. Get the code and install:
   ```bash
   sudo mkdir -p /var/www && sudo chown $USER /var/www && cd /var/www
   git clone https://github.com/<you>/smartqr.git && cd smartqr/backend
   npm ci --omit=dev
   ```
5. Create `/var/www/smartqr/backend/.env` (never commit it):
   ```bash
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://app.example.com
   DB_HOST=<rds endpoint>
   DB_PORT=3306
   DB_NAME=smartqr
   DB_USER=smartqr_user
   DB_PASSWORD=<the password from step 1>
   JWT_SECRET=<node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
   JWT_EXPIRES_IN=8h
   BCRYPT_ROUNDS=12
   ```
   `chmod 600 .env`. The server refuses to start in production if `JWT_SECRET` is missing, short or still `change_me…`, or if `FRONTEND_URL` is not `https`.
6. Create the tables: `NODE_ENV=production npx sequelize-cli db:migrate`.
   **Do not run the demo seeder in production** (it refuses to).
7. Start with PM2 (one instance only):
   ```bash
   pm2 start ../deploy/ecosystem.config.cjs --env production
   pm2 save && pm2 startup     # run the command it prints, so the app restarts after a reboot
   ```
8. Nginx + HTTPS:
   ```bash
   sudo cp ../deploy/nginx-api.conf /etc/nginx/sites-available/smartqr-api   # edit the domain first
   sudo ln -s /etc/nginx/sites-available/smartqr-api /etc/nginx/sites-enabled/
   sudo certbot --nginx -d api.example.com      # creates the certificate and renews it automatically
   sudo nginx -t && sudo systemctl reload nginx
   ```
9. Check: `curl https://api.example.com/api/v1/health` → `{"success":true,"data":{"status":"ok",...,"db":"up"}}`.

## 3. Frontend: Vercel

1. Import the GitHub repository in Vercel. Set **Root Directory** to `frontend` (Vite is detected automatically).
2. Environment variable: `VITE_API_URL = https://api.example.com/api/v1`.
3. Add the domain `app.example.com`. `frontend/vercel.json` already sends every route to the single-page app (so `/menu/<token>` links work).
4. Every pull request gets a preview link; `main` is the production site.

> The QR codes contain `FRONTEND_URL` (the backend setting). Set it to the **final** app domain **before** printing QR codes.

## 4. CI/CD with GitHub Actions

- `.github/workflows/ci.yml` runs on every pull request and every push to `main`: backend lint + tests against a MySQL 8 service, frontend lint + tests + build.
- In GitHub → Settings → Branches, protect `main` and **require the CI checks** to pass before merging.
- `.github/workflows/deploy-backend.yml` runs after a merge to `main`: it connects by SSH, pulls the code, installs, runs migrations and reloads PM2, then calls the health check.
  Add these **repository secrets**: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY` (private key text), `API_DOMAIN` (`api.example.com`).
  The server needs a GitHub deploy key (read-only) so `git fetch` works.

## 5. Production checklist

- [ ] HTTPS on both domains; `http://` redirects to `https://`
- [ ] `JWT_SECRET` is random and ≥ 32 characters; `.env` is not in Git
- [ ] RDS is private; only `api-sg` can reach port 3306; backups are on
- [ ] SSH (port 22) limited to your IP
- [ ] `FRONTEND_URL` equals the real app domain (CORS and QR links)
- [ ] First owner registered; demo seed **not** run
- [ ] Place a test order from a phone and watch it appear live on the dashboard
- [ ] Check AWS costs and credits

## Scaling note

One EC2 instance is enough for an MVP. With more than one instance, Socket.IO needs a shared adapter (for example Redis) or sticky sessions, otherwise a customer and a staff member may be connected to different servers and miss each other's events.
