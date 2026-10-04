# Agent Usage Guide: ReleasePilot

This document outlines the architecture, tech stack, and conventions for AI agents working on the ReleasePilot project (located in the `Aggroso` directory).

## Project Overview

ReleasePilot is an AI-enhanced release management tool. It analyzes release data and generates briefs using LangGraph and Gemini.

### Directory Structure

- `/backend` - The Express backend application.
  - `server.js` - Main entry point configuring Express, MongoDB, and routes.
  - `/routes` - API endpoints for releases, briefs, analysis, audit, and compare.
  - `/services` - Business logic, heavily focused on `aiService.js`.
- `/frontend` - The React SPA.
  - `vite.config.js` - Vite configuration, notably the `/api` proxy to port 5000.
  - `/src/api.js` - Centralized fetch definitions matching backend routes.
  - `/src/components`, `/src/pages`, `/src/css` - Standard React structure.

## AI Service Architecture (`backend/services/aiService.js`)

The AI service utilizes `@langchain/google-genai` and `@langchain/langgraph`.
- **State Graphs**: There are specific state graphs defined for complex tasks like `analyzeRelease` and `generateBrief`.
- **Structured Outputs**: Zod schemas (`analysisSchema`, `briefSchema`) enforce the JSON structure returned by Gemini.
- **Fallbacks**: If the AI model fails or API key is missing/invalid, fallback heuristic/template functions (`heuristicAnalysis`, `templateBrief`) are used to ensure the app continues functioning.

## Development Rules for Agents

1. **Environment Variables**:
   - The backend relies on `PORT`, `MONGODB_URI`, `GEMINI_API_KEY`, and `LLM_MODEL`.
   - Never commit `.env` files. Modify `.env.example` if adding new variables.

2. **Routing & Proxy**:
   - The frontend calls the backend using the base path `/api` (e.g., `/api/releases`).
   - Do not hardcode `localhost:5000` in the frontend; it relies on the Vite proxy defined in `vite.config.js`.

3. **Dependencies**:
   - Backend requires ESM (`"type": "module"` in `package.json`). Use `import` syntax.
   - Frontend is a standard Vite React setup.
