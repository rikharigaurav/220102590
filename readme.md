# 🚀 URL Shortener

A full-stack **URL shortener** built with **React, Node.js, and MongoDB**.  
This app allows users to shorten long links, create custom shortcodes, track click statistics, and set expiration dates for URLs.  
It also includes **health monitoring** and **centralized logging**.  

---

## ✨ Features

- 🔗 Shorten long URLs instantly  
- 🎯 Custom shortcodes (or auto-generated)  
- 📊 Click tracking & statistics  
- ⏳ Expiration dates for links  
- 📝 Centralized logging for requests, errors, and user actions  

---

<img width="920" height="424" alt="image" src="https://github.com/user-attachments/assets/1b44da12-5be4-4375-b25a-1fd718b57e8f" />
<img width="920" height="424" alt="image" src="https://github.com/user-attachments/assets/a0d66b3d-64c2-4b08-9c91-8ba8f389d049" />

## 🛠 Tech Stack

### **Frontend**
- ⚛️ React + TypeScript  
- 🎨 Material-UI (MUI)  
- ⚡ Vite (build tool)  
- 🔌 Axios (API requests)  

### **Backend**
- 🟢 Node.js + Express  
- 🍃 MongoDB (data storage)  
- 🛡 Rate limiting (security)  

### **Logging**
- 📝 Custom middleware → Evaluation service  

---

## 📂 Project Structure

backend/
├── server.js # Main server
├── models/url.js # URL schema
└── package.json

frontend/
└── src/
├── components/ # React components
├── api.ts # API handlers
└── logger.ts # Logging utility
└── package.json

logging-middleware/
└── logger.js # Logs to evaluation service

yaml
Copy code

---

## ⚙️ Setup Instructions

### **Backend**
```bash
cd backend
npm install
Create .env:

env
Copy code
MONGODB_URI=your_mongodb_connection
PORT=3001
ACCESS_TOKEN=your_eval_service_token
CORS_ORIGIN=http://localhost:5173
Start server:

bash
Copy code
npm start
Frontend
bash
Copy code
cd frontend
npm install
Create .env:

env
Copy code
VITE_ACCESS_TOKEN=your_eval_service_token
VITE_API_BASE_URL=http://localhost:3001
Run dev server:

bash
Copy code
npm run dev
App runs at → http://localhost:5173

📡 API Endpoints
Method	Endpoint	Description
POST	/api/shorten	Create a short URL
GET	/api/shorturls	Fetch all URLs
GET	/:shortcode	Redirect to original URL

🔑 Environment Variables
Backend
MONGODB_URI → MongoDB connection string

ACCESS_TOKEN → Evaluation service token

PORT → Server port (default: 3001)

CORS_ORIGIN → Frontend URL

Frontend
VITE_ACCESS_TOKEN → Evaluation service token

VITE_API_BASE_URL → Backend API base

📝 Logging
Logs are sent to the evaluation service for:

API requests & responses

Errors & warnings

User actions

🚀 Development Workflow
bash
Copy code
# Terminal 1 - backend
cd backend && npm start

# Terminal 2 - frontend
cd frontend && npm run dev
