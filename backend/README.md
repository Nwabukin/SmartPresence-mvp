# 🎓 SmartPresence Backend

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)

**A comprehensive attendance management system for educational institutions**

[🚀 Quick Start](#-quick-start) • [📚 API Documentation](#-api-documentation) • [🛠️ Development](#️-development) • [🚀 Deployment](#-deployment)

</div>

---

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [📚 API Documentation](#-api-documentation)
- [🗄️ Database Schema](#️-database-schema)
- [🛠️ Development](#️-development)
- [🚀 Deployment](#-deployment)
- [📊 Monitoring](#-monitoring)
- [🤝 Contributing](#-contributing)

---

## 🎯 Overview

SmartPresence is a modern attendance management system designed for educational institutions. The backend provides a robust REST API for managing users, classes, sessions, and attendance tracking with support for both web and mobile applications.

### 🎯 Key Capabilities

- **Multi-role Authentication**: Admin, Teacher, and Student roles with different permissions
- **Smart Attendance Tracking**: Location-based attendance using WiFi SSID and Bluetooth beacons
- **Real-time Notifications**: Push notifications for session reminders and attendance confirmations
- **Mobile-First Design**: Dedicated mobile API endpoints for student applications
- **Comprehensive Reporting**: Detailed attendance reports and analytics
- **Scalable Architecture**: Built with Node.js, Express, and PostgreSQL

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with role-based access control
- Secure password hashing with bcrypt
- Mobile-specific authentication for students
- Session management and token validation

### 👥 User Management
- **Admin**: Full system access, user management, room configuration
- **Teacher**: Class management, session creation, attendance tracking
- **Student**: Mobile app access, attendance marking, profile management

### 📚 Class & Session Management
- Create and manage classes with course codes
- Schedule sessions with room assignments
- Real-time session status tracking
- Automatic session reminders

### 📍 Smart Attendance System
- **Location Verification**: WiFi SSID and Bluetooth beacon validation
- **Device Tracking**: Prevent duplicate attendance from same device
- **Flexible Status**: Present, Absent, Late, Excused
- **Manual Override**: Teachers can modify attendance records

### 🔔 Notification System
- Session reminders
- Attendance confirmations
- Class enrollment notifications
- Session cancellation alerts

### 📱 Mobile API
- Dedicated endpoints for mobile applications
- Student-specific authentication
- Profile management
- Class enrollment and session viewing

---

## 🏗️ Architecture

```mermaid
graph TB
    A[Frontend Web App] --> B[SmartPresence Backend API]
    C[Mobile App] --> B
    B --> D[PostgreSQL Database]
    B --> E[Notification Service]
    B --> F[Authentication Service]
    
    subgraph "Backend Components"
        B1[Express.js Server]
        B2[Authentication Middleware]
        B3[Validation Layer]
        B4[Error Handling]
        B5[Database Layer]
    end
    
    B --> B1
    B1 --> B2
    B2 --> B3
    B3 --> B4
    B4 --> B5
    B5 --> D
```

### 🏛️ System Components

- **API Layer**: RESTful endpoints with comprehensive validation
- **Authentication**: JWT-based with role-based access control
- **Database**: PostgreSQL with optimized queries and indexing
- **Validation**: Joi schema validation for all inputs
- **Error Handling**: Centralized error management with detailed logging
- **Notifications**: Real-time notification system for users

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/smartpresence-backend.git
   cd smartpresence-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Create PostgreSQL database
   createdb smartpresence
   
   # Run migrations
   npm run migrate:up
   ```

5. **Start the server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

### 🔧 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ | - |
| `JWT_SECRET` | Secret key for JWT tokens | ✅ | - |
| `PORT` | Server port | ❌ | 3000 |
| `NODE_ENV` | Environment mode | ❌ | development |
| `FRONTEND_URL` | Frontend application URL | ❌ | http://localhost:5173 |
| `MOBILE_URL` | Mobile app URL | ❌ | http://192.168.1.5:3001 |

---

## 📚 API Documentation

### 🔐 Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "teacher@university.edu",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "teacher@university.edu",
      "role": "teacher"
    }
  }
}
```

### 👥 User Management

#### Create User (Admin Only)
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "student@university.edu",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "student",
  "profileStudent": {
    "matricNo": "STU001",
    "department": "Computer Science",
    "course": "BSc Computer Science",
    "level": "300",
    "phone": "+1234567890"
  }
}
```

#### Get All Users
```http
GET /api/users
Authorization: Bearer <token>
```

### 🏫 Room Management

#### Create Room (Admin Only)
```http
POST /api/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Lecture Hall A",
  "locationDescription": "Building A, Floor 2",
  "wifiSsid": "UNI_LECTURE_HALL_A",
  "bluetoothBeaconId": "BEACON_A001"
}
```

### 📚 Class Management

#### Create Class (Teacher Only)
```http
POST /api/classes
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Introduction to Programming",
  "courseCode": "CS101",
  "description": "Basic programming concepts"
}
```

### 📅 Session Management

#### Create Session
```http
POST /api/sessions
Authorization: Bearer <token>
Content-Type: application/json

{
  "classId": 1,
  "roomId": 1,
  "startTime": "2024-01-20T09:00:00Z",
  "endTime": "2024-01-20T11:00:00Z"
}
```

### 📱 Mobile API

#### Student Login (Mobile)
```http
POST /api/mobile/students/login
Content-Type: application/json

{
  "matricNo": "STU001",
  "password": "password123"
}
```

#### Get Student Profile
```http
GET /api/mobile/me
Authorization: Bearer <token>
```

#### Mark Attendance
```http
POST /api/mobile/attendance/mark
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionId": 1,
  "deviceId": "DEVICE_12345"
}
```

### 🏥 Health Checks

#### Basic Health Check
```http
GET /health
```

#### Database Health Check
```http
GET /test-db
```

---

## 🗄️ Database Schema

### Core Tables

#### Users
```sql
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Classes
```sql
CREATE TABLE classes (
    class_id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(user_id),
    name VARCHAR(150) NOT NULL,
    course_code VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Sessions
```sql
CREATE TABLE sessions (
    session_id SERIAL PRIMARY KEY,
    class_id INTEGER NOT NULL REFERENCES classes(class_id),
    room_id INTEGER NOT NULL REFERENCES rooms(room_id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Attendance Records
```sql
CREATE TABLE attendance_records (
    record_id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(session_id),
    student_id INTEGER NOT NULL REFERENCES users(user_id),
    device_id VARCHAR(200),
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status attendance_status NOT NULL DEFAULT 'present',
    modified_by_teacher_id INTEGER REFERENCES users(user_id)
);
```

### Profile Tables

#### Student Profiles
```sql
CREATE TABLE student_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id),
    matric_no VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    course VARCHAR(150) NOT NULL,
    level VARCHAR(50) NOT NULL,
    phone VARCHAR(50)
);
```

#### Teacher Profiles
```sql
CREATE TABLE teacher_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(user_id),
    lecturer_no VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    faculty VARCHAR(150) NOT NULL,
    office VARCHAR(150),
    phone VARCHAR(50)
);
```

---

## 🛠️ Development

### 📁 Project Structure

```
smartpresence-backend/
├── 📁 db/                    # Database configuration and schema
│   ├── index.js             # Database connection and queries
│   └── schema.sql           # Database schema definition
├── 📁 docs/                 # API documentation
│   ├── API_DOCUMENTATION.md
│   ├── API_TESTING_GUIDE.md
│   └── swagger.yaml
├── 📁 middleware/           # Express middleware
│   ├── auth.js              # Authentication middleware
│   └── adminMiddleware.js   # Admin-specific middleware
├── 📁 migrations/           # Database migrations
├── 📁 routes/               # API route handlers
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management
│   ├── classes.js           # Class management
│   ├── sessions.js          # Session management
│   ├── attendance.js       # Attendance tracking
│   ├── mobile.js            # Mobile API endpoints
│   └── rooms.js             # Room management
├── 📁 services/             # Business logic services
│   └── notificationService.js
├── 📁 utils/                 # Utility functions
│   ├── errorHandler.js      # Error handling utilities
│   ├── logger.js            # Logging utilities
│   ├── roles.js             # Role definitions
│   └── validation.js        # Input validation schemas
├── 📁 scripts/               # Utility scripts
│   ├── deploy-check.js      # Deployment readiness check
│   └── smoke.js             # API testing script
├── 📄 index.js              # Application entry point
├── 📄 package.json          # Dependencies and scripts
├── 📄 render.yaml           # Render deployment config
└── 📄 DEPLOYMENT.md         # Deployment guide
```

### 🔧 Development Scripts

```bash
# Start development server
npm run dev

# Run linting
npm run lint

# Format code
npm run format

# Run database migrations
npm run migrate:up

# Rollback migrations
npm run migrate:down

# Create new migration
npm run migrate:create <migration-name>

# Run deployment check
node scripts/deploy-check.js
```

### 🧪 Testing

```bash
# Run API smoke tests
node scripts/smoke.js

# Run mobile API tests
node scripts/mobile-smoke.js
```

### 📝 Coding Standards

#### Naming Conventions
- **Variables & Functions**: `camelCase` (e.g., `userId`, `getUserData`)
- **Classes**: `PascalCase` (e.g., `UserService`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_USERS`)
- **Files**: `camelCase.js` or `kebab-case.js`

#### Code Quality
- **Formatting**: Enforced by Prettier (`npm run format`)
- **Linting**: ESLint with custom rules (`npm run lint`)
- **Comments**: Explain *why*, not *what*
- **API Design**: RESTful principles with consistent JSON responses

#### Error Handling
- Centralized error handling with custom error classes
- Detailed logging with request tracking
- Consistent error response format
- Input validation using Joi schemas

---

## 🚀 Deployment

### 🌐 Render Deployment

The application is configured for easy deployment on Render:

1. **Create Render Postgres Database**
2. **Deploy Web Service** using `render.yaml`
3. **Set Environment Variables**
4. **Run Database Migrations**

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### 🔧 Environment Configuration

#### Production Environment Variables
```bash
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://your-frontend.onrender.com
MOBILE_URL=https://your-mobile-app.com
```

### 📊 Health Monitoring

- **Health Check**: `GET /health`
- **Database Check**: `GET /test-db`
- **Service Status**: Real-time monitoring via Render dashboard

---

## 📊 Monitoring

### 📈 Performance Metrics
- Response time tracking
- Database query performance
- Error rate monitoring
- User activity analytics

### 🔍 Logging
- Request/response logging
- Error tracking with stack traces
- Database query logging
- Authentication events

### 🚨 Alerts
- Service downtime notifications
- Database connection failures
- High error rates
- Performance degradation

---

## 🤝 Contributing

### 🚀 Getting Started
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 📋 Development Guidelines

#### Before Contributing
- Read the existing codebase and understand the architecture
- Check the [API Documentation](./docs/API_DOCUMENTATION.md)
- Review the [Coding Standards](#-coding-standards)
- Run the deployment check: `node scripts/deploy-check.js`

#### Code Review Process
1. **Functionality First**: Ensure the code works as expected
2. **Follow Patterns**: Maintain consistency with existing code
3. **Test Thoroughly**: Include appropriate tests
4. **Document Changes**: Update documentation as needed

#### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

### 🐛 Bug Reports

When reporting bugs, please include:
- **Environment**: Node.js version, OS, database version
- **Steps to Reproduce**: Clear, numbered steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Error Messages**: Full error logs if applicable
- **Screenshots**: If relevant to the issue

### 💡 Feature Requests

For new features, please provide:
- **Use Case**: Why is this feature needed?
- **Proposed Solution**: How should it work?
- **Alternatives**: Other approaches considered
- **Additional Context**: Any other relevant information

---

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Express.js** - Web framework
- **PostgreSQL** - Database system
- **JWT** - Authentication tokens
- **Joi** - Input validation
- **bcryptjs** - Password hashing
- **Render** - Deployment platform

---

## 📞 Support

### 🆘 Getting Help

- **Documentation**: Check the [docs](./docs/) directory
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Email**: Contact the development team

### 🔗 Useful Links

- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Testing Guide](./docs/API_TESTING_GUIDE.md)
- [Error Handling Guide](./docs/ERROR_HANDLING.md)

---

<div align="center">

**Built with ❤️ for educational institutions**

[⬆ Back to Top](#-smartpresence-backend)

</div>