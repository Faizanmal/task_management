# Task Management System - Setup & Run Guide

## Project Overview
This is a full-stack Task Management System built with:
- **Backend**: NestJS + TypeScript + Prisma + Postgres + JWT
- **Frontend Web**: Next.js + TypeScript + React
- **Mobile**: Flutter + Dart

The application allows users to register, log in, and manage their personal tasks with full CRUD capabilities, filtering, searching, and pagination across web and mobile platforms.

## Project Structure

```
e:\Assignments_Tasks\Earnestfintech\
├── backend/ (NestJS API server)
│   ├── src/
│   │   ├── auth/ (authentication module)
|   |   ├── common/ (shared utilities, guards, filters)
│   │   ├── prisma/ (database service)
│   │   ├── tasks/ (task management module)
|   │   ├── users/ (user management module)
│   │   ├── main.ts (entry point)
│   │   └── app.module.ts (root module)
│   ├── prisma/ (database schema and migrations)
│   ├── .env (environment variables)
│   └── package.json
├── frontend-web/ (Next.js web app)
│   ├── src/app/
│   │   ├── components/ (reusable components)
│   │   ├── context/ (Toast context)
│   │   ├── login/ (login page)
│   │   ├── providers/ (AuthProvider)
│   │   ├── register/ (registration page)
│   │   ├── tasks/ (task dashboard)
│   │   ├── layout.tsx (root layout)
│   │   └── page.tsx (home page)
│   ├── .env.local (environment variables)
│   └── package.json
├── mobile/ (Flutter mobile app)
│   ├── lib/
│   │   ├── models/ (data models)
│   │   ├── screens/ (UI screens)
│   │   ├── services/ (API services)
│   │   ├── state/ (state management)
│   │   ├── widgets/ (reusable widgets)
│   │   └── main.dart (entry point)
│   ├── android/ (Android platform code)
│   ├── ios/ (iOS platform code)
│   └── pubspec.yaml
└── README.md
```

## Setup Instructions

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend Web:**
```bash
cd frontend-web
npm install
```

**Mobile:**
```bash
cd mobile
flutter pub get
```

### 2. Initialize Database

```bash
cd backend
npx prisma generate
npx prisma db push
```

This will create the Postgres database and apply the schema.

### 3. Environment Variables

**Backend (.env)**
Already created with default values. Update if needed:
```
DATABASE_URL=postgresql://user:password@localhost/dbname
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="refresh-secret-key-change-in-production"
PORT=3001
```

**Frontend (.env.local)**
Already created with:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Optional (same value name used by mobile):
```
API_BASE_URL=http://localhost:3001
```

**Mobile (Dart define at run time)**

Android emulator:
```
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001
```

iOS simulator / desktop / Flutter web:
```
flutter run --dart-define=API_BASE_URL=http://localhost:3001
```

Physical device (same Wi-Fi as backend machine):
```
flutter run --dart-define=API_BASE_URL=http://<YOUR_MACHINE_IP>:3001
```

### 4. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```

**Terminal 2 - Frontend Web:**
```bash
cd frontend-web
npm run dev
```

**Terminal 3 - Mobile (choose one):**
```bash
cd mobile
# Android emulator
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001

# iOS simulator / desktop / web
flutter run --dart-define=API_BASE_URL=http://localhost:3001

# Physical device
flutter run --dart-define=API_BASE_URL=http://<YOUR_MACHINE_IP>:3001
```

The application will be available at:
- Frontend Web: http://localhost:3000
- Backend API: http://localhost:3001
- Mobile: Runs on connected device/emulator

## Features Implemented

### ✅ Authentication
- [x] User registration with email, username, and password validation
- [x] User login with JWT tokens
- [x] Password hashing with bcrypt (10 rounds)
- [x] Access Token (15 minutes expiration)
- [x] Refresh Token (7 days expiration)
- [x] Logout with token revocation
- [x] Protected routes with JWT guard
- [x] Auto-redirect based on authentication status

### ✅ Task Management
- [x] Create tasks with title and optional description
- [x] View all user tasks
- [x] Edit task details (title, description, status)
- [x] Delete tasks
- [x] Toggle task status (PENDING ↔ COMPLETED)
- [x] Search tasks by title
- [x] Filter tasks by status (PENDING, COMPLETED, ARCHIVED)
- [x] Pagination (with configurable page size)
- [x] Responsive grid layout

### ✅ Frontend Web Features
- [x] Modern gradient design
- [x] Toast notifications (success, error, info, warning)
- [x] Form validation
- [x] Error handling with user-friendly messages
- [x] Responsive design (mobile & desktop)
- [x] Session persistence with localStorage
- [x] Auto-logout on token expiration
- [x] Loading states and spinner

### ✅ Mobile Features
- [x] Cross-platform Flutter app (Android & iOS)
- [x] Same authentication flow as web
- [x] Task management with all CRUD operations
- [x] Responsive mobile UI
- [x] Offline-capable with local storage
- [x] Push notifications (future enhancement)

### ✅ Backend Features  
- [x] RESTful API architecture
- [x] Input validation with class-validator
- [x] Global error handling
- [x] CORS enabled for frontend
- [x] Pagination with metadata
- [x] Case-insensitive search
- [x] Query parameter validation
- [x] Proper HTTP status codes

## API Endpoints

### Authentication Endpoints

```
POST /auth/register
Content-Type: application/json
{
  "email": "user@example.com",
  "username": "john_doe",
  "password": "password123"
}

Response: {
  "accessToken": "...",
  "refreshToken": "...",
  "user": { "id": "...", "email": "...", "username": "..." }
}
```

```
POST /auth/login
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password123"
}
```

```
POST /auth/refresh
Content-Type: application/json
{
  "refreshToken": "..."
}

Response: { "accessToken": "..." }
```

```
POST /auth/logout
Authorization: Bearer <accessToken>
Content-Type: application/json
{
  "refreshToken": "..."
}
```

### Task Endpoints

All task endpoints require `Authorization: Bearer <accessToken>`

```
GET /tasks?page=1&limit=10&search=title&status=PENDING
Response: {
  "data": [...],
  "total": 10,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

```
POST /tasks
{
  "title": "Task Title",
  "description": "Optional description"
}
```

```
GET /tasks/:id
GET /tasks/:id/toggle
PATCH /tasks/:id
{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "COMPLETED"
}
DELETE /tasks/:id
```

## Technologies Used

### Backend
- **NestJS**: Progressive Node.js framework
- **TypeScript**: Typed JavaScript
- **Prisma**: ORM with type safety
- **PostgreSQL**: Relational database
- **JWT**: Stateless authentication
- **Bcrypt**: Password hashing
- **Passport**: Authentication middleware
- **Class Validator**: Input validation

### Frontend Web
- **Next.js**: React framework with App Router
- **TypeScript**: Type-safe development
- **React Hooks**: State management
- **Context API**: Global state (Auth, Toast)
- **CSS Modules**: Scoped styling
- **Fetch API**: HTTP communication

### Mobile
- **Flutter**: Cross-platform UI framework
- **Dart**: Programming language
- **Shared Preferences**: Local storage for session persistence
- **HTTP**: API communication
- **HTTP**: API communication

## Testing the Application

### Web Application
1. **Register**:
   - Navigate to http://localhost:3000/register
   - Fill in email, username, and password
   - Click "Create Account"

2. **Login**:
   - Navigate to http://localhost:3000/login
   - Enter email and password
   - Click "Log In"

3. **Create Task**:
   - Click "+ Add Task" button
   - Enter title and optional description
   - Click "Create Task"

4. **Manage Tasks**:
   - Use search to find tasks by title
   - Use status filter to filter tasks
   - Click "✓ Complete" to toggle status
   - Click "✎ Edit" to edit task
   - Click "🗑 Delete" to delete task

5. **Pagination**:
   - Tasks are paginated with 10 items per page
   - Use "Previous" and "Next" buttons to navigate

### Mobile Application
1. **Install Flutter** (if not already installed)
2. **Run the app** with appropriate API URL for your setup
3. **Test authentication** by registering/logging in
4. **Test task management** with CRUD operations
5. **Verify offline functionality** (if implemented)

## License

## Support

For issues or questions, refer to:
- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Flutter Documentation](https://flutter.dev/docs)
