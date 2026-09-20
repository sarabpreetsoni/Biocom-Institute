# Biocom Institute — Commerce Learning Portal
*Free education to all*

A modern React & TypeScript educational web application connecting students and administrators to a Firebase cloud backend for seamless learning management, assignment sharing, and student progress tracking.

---

## Architecture Overview

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Firebase 11
  - **Firebase Authentication**: Secure Google Sign-In for students and administrators
  - **Cloud Firestore**: Real-time database for course materials, assignments, and student rosters
  - **Firebase Cloud Storage**: File storage for downloadable assignment documents (PDFs, Word docs, images)
- **Portals**:
  - **Student Portal**: Subject selection (Accountancy, Business Studies, Economics, Practical & Projects), real-time assignment streams, document downloading.
  - **Admin Portal**: Coursework publication, file uploading with progress tracking, assignment deletion, and enrolled student rosters.
- **Offline / Demo Mode**: Built-in simulated fallback mode so the application runs locally even before live Firebase API keys are configured.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Firebase Backend
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Firebase project configuration values in `.env`:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:...
```

> **Note**: If you don't have Firebase keys yet, the application will automatically run in **Demo Mode** with mock data so you can test all features immediately.

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## Firebase Setup Guide

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. In **Authentication** → **Sign-in method**, enable the **Google** provider.
3. In **Firestore Database**, create a database and apply the rules from `firestore.rules`.
4. In **Storage**, create a default bucket and apply the rules from `storage.rules`.
5. In **Project Settings** → **General**, scroll to **Your apps**, click the web icon (`</>`), register the app, and copy the credentials into your `.env` file.
