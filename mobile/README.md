# Earnest Fintech Mobile App

Flutter client for the Task Management System, providing a native mobile experience for task management.

## Features

- **Cross-platform**: Runs on Android and iOS
- **Authentication**: Register, login, refresh token, and logout
- **Task Management**: Full CRUD operations with filtering and pagination
- **Offline Support**: Local storage for session persistence
- **Responsive UI**: Native mobile interface
- **Real-time Sync**: Automatic token refresh and request retry

## Prerequisites

- Flutter SDK installed
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Quick Start

1. **Install dependencies**:
   ```bash
   flutter pub get
   ```

2. **Start the backend** on port `3001`

3. **Run the app** with appropriate API URL:

   **Android emulator**:
   ```bash
   flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3001
   ```

   **iOS simulator / desktop / web**:
   ```bash
   flutter run --dart-define=API_BASE_URL=http://localhost:3001
   ```

   **Physical device**:
   ```bash
   flutter run --dart-define=API_BASE_URL=http://<YOUR_MACHINE_IP>:3001
   ```

## Build for Production

**Android APK**:
```bash
flutter build apk
```

**iOS (macOS only)**:
```bash
flutter build ios
```

## Project Structure

```
lib/
├── main.dart          # App entry point
├── models/            # Data models
├── screens/           # UI screens
├── services/          # API services
├── state/             # State management
├── widgets/           # Reusable widgets
```

## Technologies

- **Flutter** - Cross-platform UI framework
- **Dart** - Programming language
- **Shared Preferences** - Local storage
- **HTTP** - API communication
