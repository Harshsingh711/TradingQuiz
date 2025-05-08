# Trading Quiz Web App

A full-stack web application where users can test their trading skills by predicting market movements and compete on a leaderboard.

## Features

- Interactive trading quiz with real-time chart predictions
- User authentication and profiles
- ELO-based scoring system
- Leaderboard rankings
- Responsive design with Tailwind CSS

## Project Structure

```
trading-quiz/
├── frontend/          # Next.js frontend application
└── backend/           # Express.js backend server
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`

4. Start the development server:
   ```bash
   npm run dev
   ```

## Development

- Frontend runs on: http://localhost:3000
- Backend runs on: http://localhost:3001

## Technologies Used

- Frontend:
  - Next.js
  - React
  - Tailwind CSS
  - Axios
  - React Router

- Backend:
  - Node.js
  - Express
  - PostgreSQL
  - JWT Authentication
  - ELO Rating System 