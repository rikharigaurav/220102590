🚀 URL Shortener

A full-stack URL shortener built with React, Node.js, and MongoDB.
The app lets users shorten long links, create custom shortcodes, track click statistics, and set expiration dates for URLs. It also includes health monitoring and centralized logging.


✨ Features

🔗 Shorten long URLs instantly

🎯 Custom shortcodes or auto-generated ones

📊 Click tracking & statistics

⏳ Expiration dates for links

📝 Centralized logging for requests, errors, and user actions

🛠 Tech Stack

Frontend

React + TypeScript

Material-UI (MUI)

Vite (build tool)

Axios (API requests)

Backend

Node.js + Express

MongoDB (data storage)

Rate limiting (security)

Logging

Custom middleware → Evaluation service

📂 Project Structure
backend/
  ├── server.js          # Main server
  ├── models/url.js      # URL schema
  └── package.json

frontend/
  └── src/
      ├── components/    # React components
      ├── api.ts         # API handlers
      └── logger.ts      # Logging utility
  └── package.json

logging-middleware/
  └── logger.js          # Logs to evaluation service

⚙️ Setup Instructions
Backend
cd backend
npm install


Create .env:

MONGODB_URI=your_mongodb_connection
PORT=3001
ACCESS_TOKEN=your_eval_service_token
CORS_ORIGIN=http://localhost:5173


Start server:

npm start

Frontend
cd frontend
npm install


Create .env:

VITE_ACCESS_TOKEN=your_eval_service_token
VITE_API_BASE_URL=http://localhost:3001


Run dev server:

npm run dev


App runs on: http://localhost:5173

📡 API Endpoints
Method	Endpoint	Description
POST	/api/shorten	Create a short URL
GET	/api/shorturls	Fetch all URLs
GET	/:shortcode	Redirect to original URL
🔑 Environment Variables

Backend

MONGODB_URI → MongoDB connection string

ACCESS_TOKEN → Eval service token

PORT → Server port (default: 3001)

CORS_ORIGIN → Frontend URL

Frontend

VITE_ACCESS_TOKEN → Eval service token

VITE_API_BASE_URL → Backend API base

📝 Logging

The app sends logs to the evaluation service for:

API requests & responses

Errors & warnings

User actions

🚀 Development Workflow
# Terminal 1 - backend
cd backend && npm start

# Terminal 2 - frontend
cd frontend && npm run dev
