# Nexora - Peer Learning Hub

Nexora is a modern MERN-stack subscription marketplace that creates a secure, dynamic learning environment between verified **Mentors** and **Students**. Key highlights include Google-only authentication, direct real-time chat, learning lockers, and auto-graded mock examinations with safety-check single-attempt logic.

---

## 🚀 Key Features

*   **Verified Google-Only Auth:** Dynamic user enrollment restricting access to verified Gmail users to safeguard dashboards.
*   **Workspace Learning Lockers:**
    *   **Mentors** upload lecture recordings, PDFs, slideshows, and study guides.
    *   **Students** access, stream, and download resources (.pdf, .mp4, etc.) via responsive inline preview tools.
*   **Secure Mock Examinations:**
    *   Educators design customized multiple-choice tests.
    *   Automatic submission grading with detailed analytics.
    *   Single-attempt lock system preventing students from retaking completed tests.
*   **Real-time Socket.io Chat:** instant 1:1 consult channels connecting subscribers to their respective mentors.
*   **Mailbox & Notification System:** Keeps users updated when new courses are published, tests are deployed, or subscriptions are modified.

---

## 🛠️ Architecture & Tech Stack

### Frontend
*   **React 19 & Vite** (Optimized client-side rendering)
*   **Tailwind CSS** (Responsive Dark Theme UI)
*   **Lucide React** (Modern iconography)
*   **Socket.io-client** (Real-time connection)
*   **@react-oauth/google** (Secure Client-side Sign-in)

### Backend
*   **Node.js & Express** (Rest API Engine)
*   **MongoDB & Mongoose** (NoSQL Database storage)
*   **Socket.io** (Bidirectional WebSocket server)
*   **Multer / Storage Bypass** (Dual local directory stream & Cloudinary endpoints)

---

## 📁 Repository Structure

```text
Nexora/
├── backend/
│   ├── config/          # DB and Cloudinary connections
│   ├── controllers/     # Route logic handlers (auth, tests, files, chat)
│   ├── middleware/      # Bearer JWT auth verification
│   ├── models/          # Mongoose DB Schemas (User, Test, Notification, File, Message)
│   ├── routes/          # Express route endpoints
│   ├── uploads/         # Local persistent folder for PDF/Resource hosting
│   ├── server.js        # Main Express and Socket.io server
│   └── package.json
└── frontend/
    ├── public/          # Static assets including logo.png
    ├── src/
    │   ├── components/  # Private/Protected Route wrappers
    │   ├── context/     # Global React AuthContext state 
    │   ├── pages/       # Landing, Login, Student, and Mentor Dashboards
    │   ├── App.jsx      # Navigation routing maps
    │   └── main.jsx     # App entry point
    └── package.json
```

---

## ⚙️ Development Setup

### 1. Backend Secrets (`backend/.env`)
Create a `.env` file under the `/backend` folder:
```ini
PORT=5000
MONGO_URI=your_mongodb_cluster_connection_uri
JWT_SECRET=your_jwt_signature_secret
GOOGLE_CLIENT_ID=your_google_cloud_client_id
GOOGLE_CLIENT_SECRET=your_google_cloud_client_secret
FRONTEND_URL=http://localhost:5173

# Media services
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 2. Frontend Configuration (`frontend/.env`)
Create a `.env` file under the `/frontend` folder:
```ini
VITE_BACKEND_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_cloud_client_id
```

---

## 🏃 Run the Application Locally

### Start Backend Server
```bash
cd backend
npm install
npm run dev
```

### Start Frontend Server
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173/`** to interact with the Nexora Hub interface!

---

## 🌐 Production Deployment Best Practice

*   **Google OAuth:** Ensure your production domain is listed under **Authorized JavaScript origins** and **Redirect URIs** in your [Google Cloud console](https://console.cloud.google.com/).
*   **Persistent volumes:** Because PDF/DOCX materials bypass typical raw constraints and write directly to `backend/uploads`, ensure your hosting deployment (Render/Railway/AWS) maps a **Persistent Storage Volume** to `/backend/uploads` to save study guides permanently.
