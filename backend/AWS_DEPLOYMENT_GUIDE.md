# 🚀 SmartPresence Backend - AWS Elastic Beanstalk Deployment Guide

## ✅ **Deployment Package Ready!**

Your backend is now packaged and ready for deployment to AWS Elastic Beanstalk.

**📦 Package Created:** `smartpresence-backend.zip` (126 KB)

---

## 🎯 **Step-by-Step Deployment Instructions**

### **1. Access AWS Elastic Beanstalk Console**
- Go to: https://console.aws.amazon.com/elasticbeanstalk/
- Make sure you're in the **us-east-1** region (N. Virginia)

### **2. Create Application**
1. Click **"Create Application"**
2. **Application name:** `SmartPresence`
3. **Description:** `SmartPresence MVP Backend API`
4. Click **"Create Application"**

### **3. Create Environment**
1. Click **"Create Environment"**
2. **Environment tier:** Web server environment
3. **Platform:** Node.js 18
4. **Platform branch:** Node.js 18 running on 64bit Amazon Linux 2023
5. **Platform version:** Latest
6. **Application code:** Upload your code
7. **Upload:** Select `smartpresence-backend.zip`
8. Click **"Create Environment"**

### **4. Configure Environment Variables**
After the environment is created:

1. Go to **Configuration** → **Software**
2. **Environment properties** section, add:

```
DATABASE_URL = postgresql://postgres:SmartPresence123@smartpresence.c7co2emswxi6.eu-central-1.rds.amazonaws.com:5432/smartpresence
JWT_SECRET = 73c8a46f8ed4a0ea687854076134a1936d8936be7b24dca35805b85c3d2e91ad4deeaa2fd2e55264e3ac381f1ee7c33425c64ce5eee294f70b771fa10be93146
AWS_REGION = us-east-1
S3_BUCKET = smartpresence-biometrics-nwabu-us-east-1-1759414530
REKOG_COLLECTION_ID = smartpresence-students
NODE_ENV = production
PORT = 8080
```

3. Click **"Apply"**

### **5. Configure Security Groups**
1. Go to **Configuration** → **Instances**
2. **Security groups:** Click **"Edit"**
3. Add inbound rule:
   - **Type:** HTTP
   - **Port:** 80
   - **Source:** 0.0.0.0/0
4. Add inbound rule:
   - **Type:** HTTPS
   - **Port:** 443
   - **Source:** 0.0.0.0/0
5. Click **"Apply"**

### **6. Configure Load Balancer**
1. Go to **Configuration** → **Load balancer**
2. **Listener:** Add HTTPS listener
3. **Port:** 443
4. **Protocol:** HTTPS
5. **SSL certificate:** Use AWS Certificate Manager (free)
6. Click **"Apply"**

---

## 🔧 **Post-Deployment Configuration**

### **1. Update Mobile App API URL**
Once deployed, your backend will be available at:
```
https://your-app-name.us-east-1.elasticbeanstalk.com
```

Update your mobile app's API service:
```dart
// In mobile-app/lib/services/api_service.dart
static const String baseUrl = 'https://your-app-name.us-east-1.elasticbeanstalk.com/api';
```

### **2. Test Your Deployment**
1. **Health Check:** `https://your-app-name.us-east-1.elasticbeanstalk.com/health`
2. **API Test:** `https://your-app-name.us-east-1.elasticbeanstalk.com/api/mobile/me`

### **3. Monitor Your Application**
- **Logs:** Go to **Logs** → **Request Logs** → **Full Logs**
- **Metrics:** Monitor CPU, Memory, and Request metrics
- **Health:** Check environment health status

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Environment Variables Not Set**
   - Ensure all environment variables are configured in EB Console
   - Restart the environment after adding variables

2. **Database Connection Issues**
   - Verify RDS security groups allow EB instances
   - Check DATABASE_URL format

3. **AWS Permissions Issues**
   - Ensure your AWS user has necessary permissions
   - Add IAM policies for EB, RDS, S3, and Rekognition

4. **Application Won't Start**
   - Check logs for startup errors
   - Verify package.json start script
   - Ensure all dependencies are in package.json

### **Useful Commands:**
```bash
# View logs
eb logs

# Check environment health
eb health

# Deploy updates
eb deploy
```

---

## 📊 **Expected Costs (Monthly)**

- **Elastic Beanstalk:** ~$15-30 (t1.micro instance)
- **RDS PostgreSQL:** ~$20-40 (db.t3.micro)
- **S3 Storage:** ~$1-5 (depending on usage)
- **Rekognition:** ~$1-10 (per 1000 face searches)
- **Data Transfer:** ~$1-5

**Total Estimated:** $40-90/month

---

## 🎉 **Success!**

Once deployed, your SmartPresence backend will be:
- ✅ **Scalable:** Auto-scaling based on traffic
- ✅ **Secure:** HTTPS with SSL certificates
- ✅ **Monitored:** Built-in health checks and logging
- ✅ **Reliable:** AWS infrastructure with 99.95% uptime

Your mobile app can now connect to the production backend instead of localhost!

---

## 📞 **Need Help?**

If you encounter any issues:
1. Check the EB Console logs
2. Verify all environment variables
3. Test the health endpoint
4. Check AWS service status

**Next Steps:**
1. Deploy your backend using this guide
2. Update mobile app API URLs
3. Test the complete flow
4. Monitor and optimize as needed
