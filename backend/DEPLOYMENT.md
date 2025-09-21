# SmartPresence Backend - Render Deployment Guide

This guide will help you deploy the SmartPresence backend to Render.

## Prerequisites

1. A Render account (sign up at [render.com](https://render.com))
2. A GitHub repository with your SmartPresence backend code
3. A Render Postgres database (free tier available)

## Deployment Steps

### 1. Create a Render Postgres Database

1. Log into your Render dashboard
2. Click "New +" → "PostgreSQL"
3. Configure your database:
   - **Name**: `smartpresence-db`
   - **Database**: `smartpresence`
   - **User**: `smartpresence_user`
   - **Plan**: Free (for development)
4. Click "Create Database"
5. Note down the **External Database URL** from the database dashboard

### 2. Deploy the Backend Service

1. In your Render dashboard, click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:

#### Basic Settings

- **Name**: `smartpresence-backend`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)

#### Build & Deploy

- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`

> **Note**: Migrations are now handled automatically during startup, not during the build process. This ensures the database is available before running migrations.

#### Environment Variables

Add these environment variables in the Render dashboard:

```
NODE_ENV=production
PORT=10000
DATABASE_URL=<your-postgres-external-url>
JWT_SECRET=<generate-a-strong-secret-key>
FRONTEND_URL=https://your-frontend-url.onrender.com
MOBILE_URL=<your-mobile-app-url>
```

### 3. Generate JWT Secret

Generate a strong JWT secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 64
```

### 4. Configure CORS

Update the `FRONTEND_URL` and `MOBILE_URL` environment variables with your actual production URLs.

### 5. Database Migrations

The migrations will run automatically during deployment due to the `postinstall` script in `package.json`.

If you need to run migrations manually:

```bash
npm run migrate:up
```

## Environment Variables Reference

| Variable       | Description                  | Required | Example                               |
| -------------- | ---------------------------- | -------- | ------------------------------------- |
| `NODE_ENV`     | Environment mode             | Yes      | `production`                          |
| `PORT`         | Server port                  | Yes      | `10000`                               |
| `DATABASE_URL` | PostgreSQL connection string | Yes      | `postgresql://user:pass@host:port/db` |
| `JWT_SECRET`   | Secret for JWT tokens        | Yes      | `your-super-secret-key`               |
| `FRONTEND_URL` | Frontend application URL     | No       | `https://smartpresence.onrender.com`  |
| `MOBILE_URL`   | Mobile app URL               | No       | `https://your-mobile-app.com`         |

## Health Checks

The application provides several health check endpoints:

- **`/health`** - Basic health check (used by Render)
- **`/test-db`** - Database connection test
- **`/`** - Basic service info

## Monitoring

1. **Logs**: View real-time logs in the Render dashboard
2. **Metrics**: Monitor CPU, memory, and response times
3. **Alerts**: Set up alerts for service downtime

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Verify `DATABASE_URL` is correct
   - Check if the database is running
   - Ensure SSL is properly configured

2. **CORS Errors**

   - Update `FRONTEND_URL` and `MOBILE_URL` environment variables
   - Check the CORS configuration in `index.js`

3. **Migration Failures**

   - Check database permissions
   - Verify migration files are present
   - Run migrations manually if needed

4. **JWT Errors**
   - Ensure `JWT_SECRET` is set
   - Use a strong, random secret key

### Debug Commands

```bash
# Test database connection
curl https://your-app.onrender.com/test-db

# Check health status
curl https://your-app.onrender.com/health

# Test API endpoint
curl https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Production Checklist

- [ ] Database is created and accessible
- [ ] Environment variables are set
- [ ] JWT secret is strong and secure
- [ ] CORS is configured for production URLs
- [ ] Health checks are working
- [ ] Database migrations completed
- [ ] SSL/HTTPS is enabled (automatic on Render)
- [ ] Monitoring and alerts are configured

## Scaling

For production with higher traffic:

1. **Upgrade Database Plan**: Move from free to paid PostgreSQL plan
2. **Service Plan**: Upgrade to paid web service plan for better performance
3. **Load Balancing**: Use multiple service instances
4. **Caching**: Implement Redis for session storage
5. **CDN**: Use Render's CDN for static assets

## Security Considerations

1. **Environment Variables**: Never commit secrets to git
2. **Database Access**: Use connection pooling and SSL
3. **CORS**: Restrict origins to known domains
4. **Rate Limiting**: Consider implementing rate limiting
5. **Input Validation**: All inputs are validated using Joi
6. **Error Handling**: Sensitive information is not exposed in errors

## Support

For issues with this deployment:

1. Check Render service logs
2. Verify environment variables
3. Test database connectivity
4. Review the application code for errors

For Render-specific issues, consult the [Render Documentation](https://render.com/docs).
