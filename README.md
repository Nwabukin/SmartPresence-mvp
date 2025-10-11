# 🚀 SmartPresence MVP

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/Nwabukin/SmartPresence-mvp)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)](https://github.com/Nwabukin/SmartPresence-mvp)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/Nwabukin/SmartPresence-mvp)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3+-blue)](https://flutter.dev/)
[![React](https://img.shields.io/badge/React-19+-blue)](https://reactjs.org/)

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Development](#development)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [License](#license)

## 🎯 Overview

SmartPresence MVP is a comprehensive attendance management solution that uses advanced location verification through Wi-Fi SSID and Bluetooth beacon detection to ensure students are physically present in classrooms. The system provides a complete ecosystem with web portal for administrators and teachers, and a mobile app for students.

### Key Capabilities
- **📍 Location Verification**: Wi-Fi SSID and Bluetooth beacon detection
- **👥 Multi-Role System**: Admin, Teacher, and Student roles with appropriate permissions
- **📱 Cross-Platform**: Web portal and mobile app for different user types
- **🔐 Secure Authentication**: JWT-based authentication with role-based access control
- **📊 Real-time Tracking**: Live attendance tracking and reporting
- **🤖 Biometric Integration**: Face recognition for enhanced security

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication with 1-hour token expiration
- Role-based access control (Admin, Teacher, Student)
- Secure password hashing with bcrypt
- Biometric face recognition for student enrollment
- AWS Rekognition integration for face indexing

### 📍 Location Verification
- Wi-Fi SSID detection and verification
- Bluetooth beacon scanning and validation
- Time window enforcement for attendance sessions
- Location-based attendance validation

### 👥 User Management
- **Admin**: Complete user management, room configuration, system oversight
- **Teacher**: Class and session management, attendance monitoring
- **Student**: Class enrollment, attendance marking, profile management

### 📊 Attendance System
- Real-time attendance tracking
- Session-based attendance with time windows
- Duplicate attendance prevention
- Attendance history and reporting
- Location-verified attendance records

### 🌐 Multi-Platform Access
- **Web Portal**: React-based admin and teacher interface
- **Mobile App**: Flutter-based student application
- **Responsive Design**: Optimized for all device types

## 🛠️ Tech Stack

### Backend
![Node.js](https://img.shields.io/badge/Node.js-20+-green) **Node.js 20+**
![Express](https://img.shields.io/badge/Express-5.x-blue) **Express.js 5**
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue) **PostgreSQL 15+**
![JWT](https://img.shields.io/badge/JWT-Authentication-orange) **JWT Authentication**
![AWS](https://img.shields.io/badge/AWS-Services-orange) **AWS Services**

**Key Dependencies:**
- `express` - Web framework
- `pg` - PostgreSQL client
- `jsonwebtoken` - JWT handling
- `bcryptjs` - Password hashing
- `cors` - Cross-origin resource sharing
- `joi` - Data validation
- `@aws-sdk/client-s3` - S3 integration
- `@aws-sdk/client-rekognition` - Face recognition

### Frontend (Web Portal)
![React](https://img.shields.io/badge/React-19+-blue) **React 19**
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue) **TypeScript 5**
![Vite](https://img.shields.io/badge/Vite-6+-purple) **Vite 6**
![React Router](https://img.shields.io/badge/React_Router-7+-blue) **React Router 7**

**Key Features:**
- Modern React with hooks and context
- Responsive design with CSS modules
- State management with React Context
- API integration with axios
- Form validation and error handling

### Mobile App
![Flutter](https://img.shields.io/badge/Flutter-3+-blue) **Flutter 3**
![Dart](https://img.shields.io/badge/Dart-3+-blue) **Dart 3**
![Material Design](https://img.shields.io/badge/Material_Design-3+-purple) **Material Design 3**

**Key Dependencies:**
- `camera` - Camera integration for biometric enrollment
- `flutter_blue_plus` - Bluetooth scanning
- `wifi_scan` - Wi-Fi SSID detection
- `location` - GPS location services
- `local_auth` - Biometric authentication
- `google_fonts` - Typography
- `provider` - State management
- `http` - API communication

### Infrastructure & Deployment
![AWS](https://img.shields.io/badge/AWS-Elastic_Beanstalk-orange) **AWS Elastic Beanstalk**
![AWS RDS](https://img.shields.io/badge/AWS-RDS-blue) **AWS RDS PostgreSQL**
![AWS S3](https://img.shields.io/badge/AWS-S3-orange) **AWS S3 Storage**
![AWS Rekognition](https://img.shields.io/badge/AWS-Rekognition-purple) **AWS Rekognition**

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WP[Web Portal<br/>React + Vite]
        MA[Mobile App<br/>Flutter]
    end
    
    subgraph "API Layer"
        API[Backend API<br/>Node.js + Express]
    end
    
    subgraph "Database Layer"
        DB[(PostgreSQL<br/>Database)]
    end
    
    subgraph "AWS Services"
        S3[AWS S3<br/>Image Storage]
        REK[AWS Rekognition<br/>Face Recognition]
        EB[AWS Elastic Beanstalk<br/>Hosting]
    end
    
    WP --> API
    MA --> API
    API --> DB
    API --> S3
    API --> REK
    API --> EB
```

### System Components

#### Backend API (`backend/`)
- **Entry Point**: `index.js` - Express server configuration
- **Database**: `db/index.js` - PostgreSQL connection and query helpers
- **Authentication**: `routes/auth.js` - JWT-based authentication
- **Routes**: Modular route handlers for different entities
- **Middleware**: Authentication and authorization middleware
- **Services**: Business logic and external service integration

#### Web Portal (`web-portal/`)
- **Entry Point**: `src/main.jsx` - React application bootstrap
- **Components**: Reusable UI components
- **Pages**: Role-specific page components
- **Context**: Authentication and application state management
- **Services**: API communication layer

#### Mobile App (`mobile-app/`)
- **Entry Point**: `lib/main.dart` - Flutter application bootstrap
- **Screens**: User interface screens
- **Widgets**: Reusable UI components
- **Services**: API communication and device integration
- **Models**: Data models and state management

## 🚀 Installation

### Prerequisites
- **Node.js 20+** and npm 10+
- **PostgreSQL 15+** (local or managed)
- **Flutter SDK 3.7+** (for mobile app)
- **Git** for version control

### Environment Setup

#### 1. Clone Repository
```bash
git clone https://github.com/Nwabukin/SmartPresence-mvp.git
cd SmartPresence-mvp
```

#### 2. Backend Setup
```bash
cd backend
npm install

# Create environment file
cp env.example .env

# Configure environment variables
# Edit .env with your database and JWT settings
```

**Required Environment Variables:**
```env
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB_NAME
JWT_SECRET=your_long_random_secret_key
AWS_REGION=us-east-1
S3_BUCKET=your-s3-bucket-name
REKOG_COLLECTION_ID=your-rekognition-collection
```

#### 3. Database Setup
```bash
# Create database
createdb smartpresence

# Run migrations
npm run migrate:up

# Seed initial data (optional)
npm run seed
```

#### 4. Web Portal Setup
```bash
cd web-portal
npm install

# Create environment file
echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env
```

#### 5. Mobile App Setup
```bash
cd mobile-app
flutter pub get

# Configure API endpoint in lib/services/api_service.dart
# Update baseUrl to your backend URL
```

### Quick Start

#### Start Backend
```bash
cd backend
npm run dev
# API available at http://localhost:3000
```

#### Start Web Portal
```bash
cd web-portal
npm run dev
# Portal available at http://localhost:5173
```

#### Start Mobile App
```bash
cd mobile-app
flutter run
# App will launch on connected device/emulator
```

## 📖 Usage

### User Roles & Permissions

#### 👨‍💼 Admin
- **User Management**: Create, update, delete teachers and students
- **Room Configuration**: Set up rooms with Wi-Fi SSID and Bluetooth beacon IDs
- **System Oversight**: Monitor attendance, manage classes, view reports
- **Access**: Full system access with administrative privileges

#### 👨‍🏫 Teacher
- **Class Management**: Create and manage classes
- **Session Control**: Start and stop attendance sessions
- **Student Enrollment**: Enroll students in classes
- **Attendance Monitoring**: View and manage attendance records
- **Access**: Limited to assigned classes and students

#### 👨‍🎓 Student
- **Class Enrollment**: View and enroll in available classes
- **Attendance Marking**: Mark attendance during active sessions
- **Profile Management**: Update personal information
- **Biometric Enrollment**: Set up face recognition for attendance
- **Access**: Limited to enrolled classes and personal profile

### Attendance Flow

1. **Student Login**: Student logs in to mobile app
2. **Class Selection**: Student selects enrolled class with active session
3. **Location Verification**: App scans Wi-Fi SSID and Bluetooth beacons
4. **Biometric Verification**: Face recognition for additional security
5. **Attendance Submission**: System verifies location and time constraints
6. **Confirmation**: Attendance is recorded if all checks pass

### API Usage Examples

#### Authentication
```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'student@example.com',
    password: 'password123'
  })
});

const { token, user } = await response.json();
```

#### Mark Attendance
```javascrip#### Mark Attendance
```javascript
// Mark attendance for a session
const response = await fetch('/api/attendance/mark', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    sessionId: 123,
    wifiSSID: 'Classroom-WiFi',
    bluetoothBeaconId: 'BEACON-001'
  })
});
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout

#### Users (Admin)
- `GET /users` - List all users
- `POST /users` - Create new user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### Classes & Sessions
- `GET /classes` - List classes
- `POST /classes` - Create class
- `GET /sessions` - List sessions
- `POST /sessions` - Create session

#### Attendance
- `POST /attendance/mark` - Mark attendance
- `GET /attendance/history` - Get attendance history

#### Mobile App
- `GET /mobile/classes` - Get student classes
- `POST /mobile/biometrics/enroll` - Biometric enrollment
- `POST /mobile/biometrics/verify` - Face verification

### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

For complete API documentation, see [backend/docs/API_DOCUMENTATION.md](backend/docs/API_DOCUMENTATION.md).

## 🚀 Deployment

### AWS Elastic Beanstalk Deployment

#### Prerequisites
- AWS CLI configured
- EB CLI installed
- AWS account with appropriate permissions

#### Backend Deployment
```bash
cd backend

# Initialize Elastic Beanstalk
eb init

# Create environment
eb create production

# Deploy
eb deploy
```

#### Environment Variables
Configure these in AWS Elastic Beanstalk:
```env
DATABASE_URL=postgres://user:pass@host:port/db
JWT_SECRET=your_jwt_secret
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name
REKOG_COLLECTION_ID=your-collection-id
```

#### Database Setup
```bash
# Run migrations on production
npm run migrate:up

# Create test users
npm run setup:users
```

### Mobile App Deployment

#### Android
```bash
cd mobile-app

# Build APK
flutter build apk --release

# Build App Bundle
flutter build appbundle --release
```

#### iOS
```bash
cd mobile-app

# Build iOS
flutter build ios --release
```

### Web Portal Deployment

#### Build for Production
```bash
cd web-portal

# Build
npm run build

# Preview
npm run preview
```

## 🛠️ Development

### Development Workflow

#### Gitflow Branching Strategy
- **`main`**: Production-ready code only
- **`develop`**: Integration branch for features
- **`feature/<name>`**: Feature development branches
- **`release/<version>`**: Release preparation branches
- **`hotfix/<name>`**: Critical production fixes

#### Getting Started
```bash
# Clone repository
git clone https://github.com/Nwabukin/SmartPresence-mvp.git
cd SmartPresence-mvp

# Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Code Standards

#### Backend (Node.js)
- **Naming**: `camelCase` for variables, `PascalCase` for classes
- **Formatting**: Prettier with ESLint
- **Testing**: Jest for unit tests
- **Documentation**: JSDoc comments for functions

#### Frontend (React)
- **Naming**: `PascalCase` for components, `camelCase` for functions
- **Formatting**: Prettier with ESLint
- **Components**: Functional components with hooks
- **State**: React Context for global state

#### Mobile (Flutter)
- **Naming**: `snake_case` for files, `PascalCase` for classes
- **Formatting**: `dart format`
- **Architecture**: Provider pattern for state management
- **Widgets**: Reusable widget components

### Scripts

#### Backend
```bash
npm run dev          # Start development server
npm run test         # Run tests
npm run lint         # Lint code
npm run format      # Format code
npm run migrate:up    # Run database migrations
npm run migrate:down # Rollback migrations
```

#### Web Portal
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
npm run format       # Format code
```

#### Mobile App
```bash
flutter run          # Run on device/emulator
flutter build apk    # Build Android APK
flutter build ios    # Build iOS app
flutter test         # Run tests
flutter analyze      # Analyze code
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # Coverage report
```

### Frontend Testing
```bash
cd web-portal
npm test                    # Run tests
npm run test:coverage       # Coverage report
```

### Mobile App Testing
```bash
cd mobile-app
flutter test                # Run unit tests
flutter integration_test    # Run integration tests
```

### API Testing
```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Test protected endpoint
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🐛 Troubleshooting

### Common Issues

#### Backend Issues
**Problem**: API won't start
```bash
# Check environment variables
cat backend/.env

# Verify database connection
npm run test-db

# Check logs
tail -f backend/logs/combined.log
```

**Problem**: Database connection failed
```bash
# Check PostgreSQL status
pg_ctl status

# Verify DATABASE_URL format
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT NOW();"
```

#### Frontend Issues
**Problem**: Web portal can't reach API
```bash
# Check API base URL
cat web-portal/.env

# Verify CORS settings
# Check browser network tab for errors
```

**Problem**: Build fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check
```

#### Mobile App Issues
**Problem**: Flutter build fails
```bash
# Clean and rebuild
flutter clean
flutter pub get
flutter run

# Check for dependency conflicts
flutter pub deps
```

**Problem**: Camera permission denied
```bash
# Check Android permissions in android/app/src/main/AndroidManifest.xml
# Check iOS permissions in ios/Runner/Info.plist
```

### Debug Mode

#### Backend Debug
```bash
# Enable debug logging
DEBUG=* npm run dev

# Database query logging
DEBUG=pg npm run dev
```

#### Frontend Debug
```bash
# Enable React DevTools
# Install browser extension
# Use React Developer Tools
```

#### Mobile Debug
```bash
# Enable Flutter debug mode
flutter run --debug

# Check device logs
flutter logs
```

## 📊 Performance

### Backend Optimization
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: PostgreSQL connection pooling
- **Caching**: Redis for session and data caching
- **Compression**: Gzip compression for API responses

### Frontend Optimization
- **Code Splitting**: Lazy loading of components
- **Bundle Analysis**: Webpack bundle analyzer
- **Image Optimization**: Compressed images and lazy loading
- **Caching**: Service worker for offline support

### Mobile Optimization
- **State Management**: Efficient state updates
- **Image Caching**: Cached network images
- **Background Processing**: Optimized background tasks
- **Memory Management**: Proper widget disposal

## 🔒 Security

### Authentication Security
- **JWT Tokens**: Secure token generation and validation
- **Password Hashing**: bcrypt with salt rounds
- **Token Expiration**: 1-hour token lifetime
- **Refresh Tokens**: Secure token refresh mechanism

### API Security
- **CORS Configuration**: Restricted cross-origin requests
- **Rate Limiting**: API rate limiting
- **Input Validation**: Joi schema validation
- **SQL Injection Prevention**: Parameterized queries

### Data Security
- **Encryption**: Sensitive data encryption
- **Secure Storage**: Encrypted local storage
- **HTTPS**: SSL/TLS encryption
- **Environment Variables**: Secure configuration management

## 📈 Monitoring

### Application Monitoring
- **Health Checks**: `/api/health` endpoint
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: Response time monitoring
- **Database Monitoring**: Query performance tracking

### Logging
```bash
# Backend logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Application logs
pm2 logs smartpresence-backend
```

## 🚀 Roadmap

### Phase 1: Core Features ✅
- [x] User authentication and authorization
- [x] Role-based access control
- [x] Basic attendance system
- [x] Location verification
- [x] Biometric enrollment

### Phase 2: Enhanced Features 🚧
- [ ] Real-time notifications
- [ ] Advanced reporting dashboard
- [ ] Bulk user import/export
- [ ] Mobile app offline support
- [ ] Multi-language support

### Phase 3: Advanced Features 📋
- [ ] AI-powered attendance analytics
- [ ] Integration with LMS systems
- [ ] Advanced biometric options
- [ ] Mobile app for teachers
- [ ] API rate limiting and monitoring

### Phase 4: Enterprise Features 🔮
- [ ] Multi-tenant support
- [ ] Advanced security features
- [ ] Custom reporting
- [ ] Third-party integrations
- [ ] White-label solutions

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Submit a pull request

### Development Guidelines
- Follow the coding standards
- Write comprehensive tests
- Update documentation
- Use meaningful commit messages
- Keep pull requests focused

### Code Review Process
1. Automated tests must pass
2. Code review by maintainers
3. Security review for sensitive changes
4. Documentation updates required

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **AWS Services**: For cloud infrastructure and AI services
- **Open Source Community**: For the amazing tools and libraries
- **Contributors**: All developers who contributed to this project
- **Educational Institutions**: For providing feedback and requirements

## 📞 Support

### Documentation
- [API Documentation](backend/docs/API_DOCUMENTATION.md)
- [Development Process](Docs/DEVELOPMENT_PROCESS.md)
- [AI Assistant Guidelines](Docs/AI_ASSISTANT_GUIDELINES.md)

### Contact
- **Issues**: [GitHub Issues](https://github.com/Nwabukin/SmartPresence-mvp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Nwabukin/SmartPresence-mvp/discussions)
- **Email**: [Contact Information]

---

<div align="center">

**SmartPresence MVP** - *Smart Attendance Management System*

[![GitHub](https://img.shields.io/badge/GitHub-Repository-black?style=for-the-badge&logo=github)](https://github.com/Nwabukin/SmartPresence-mvp)
[![Documentation](https://img.shields.io/badge/Documentation-Read-blue?style=for-the-badge&logo=gitbook)](https://github.com/Nwabukin/SmartPresence-mvp/tree/main/Docs)
[![Issues](https://img.shields.io/badge/Issues-Report-red?style=for-the-badge&logo=github)](https://github.com/Nwabukin/SmartPresence-mvp/issues)

</div>