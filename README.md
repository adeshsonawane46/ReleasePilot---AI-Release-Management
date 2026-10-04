# ReleasePilot

ReleasePilot is an AI-powered release management platform designed to automate and enhance the software release process. It leverages Google Gemini to analyze release candidates, flag risks, validate evidence, and generate comprehensive release briefs tailored for different audiences.

## Key Features

- **AI Release Analysis**: Extracts and analyzes features, bug fixes, claims, and risks from release data using Google Gemini via LangChain.
- **Automated Brief Generation**: Generates technical or stakeholder release briefs based on release content.
- **Release Comparisons**: Compare different releases to see what changed.
- **Audit Logging**: Track important actions within the platform.

## Tech Stack

- **Backend**: Node.js, Express, MongoDB (Mongoose), LangChain, Google GenAI
- **Frontend**: React 18, Vite, React Router DOM
- **AI Integration**: Gemini 2.5 Flash (via LangChain's `@langchain/google-genai` and `@langchain/langgraph`)

## Prerequisites

- Node.js (v18 or higher)
- MongoDB running locally (or adjust the `MONGODB_URI`)
- Google Gemini API Key

## Setup

1. **Clone the repository:**
   ```bash
   git clone <repository_url>
   cd Aggroso
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   - Copy `.env.example` to `.env` in the root directory (or `backend/.env`) and update it with your Gemini API key and MongoDB URI.

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```

## Running the Application

1. **Start the backend server:**
   ```bash
   cd backend
   npm run dev
   ```
   The API will be available at `http://localhost:5000`.

2. **Start the frontend application:**
   ```bash
   cd frontend
   npm run dev
   ```
   The application will be available at `http://localhost:5173`. The Vite server automatically proxies `/api` requests to the backend server.
