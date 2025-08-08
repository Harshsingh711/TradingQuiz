# 🎯 Trading Quiz - Live Bitcoin Prediction Game

**[🌐 LIVE WEBSITE](https://trading-quiz-pppdtyjb9-harshsingh711s-projects.vercel.app)**

Test your trading skills with our interactive Bitcoin price prediction game! Compete against other traders, climb the leaderboard, and prove your market intuition.

## 🚀 Live Demo

**🎮 [Play Now](https://trading-quiz-pppdtyjb9-harshsingh711s-projects.vercel.app)**

Experience real-time Bitcoin chart analysis, make predictions, and compete for the top spot on our global leaderboard!

## ✨ Features

### 🎯 **Interactive Trading Quiz**
- Real-time Bitcoin price charts
- Make buy/sell predictions
- Test your market timing skills
- Realistic trading simulation

### 🏆 **Competitive Leaderboard**
- ELO-based scoring system
- Global rankings
- Track your progress
- Compare with other traders

### 👤 **User System**
- Secure authentication
- Personal profiles
- Trading history
- Performance analytics

### 📊 **Advanced Analytics**
- ELO rating changes
- Win/loss statistics
- Trading accuracy metrics
- Performance tracking

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern, responsive design
- **Lightweight Charts** - Professional trading charts
- **JWT Authentication** - Secure user sessions

### Backend
- **Node.js & Express** - Robust API server
- **PostgreSQL** - Reliable database
- **TypeORM** - Database management
- **JWT & bcrypt** - Secure authentication
- **CORS** - Cross-origin resource sharing

### Deployment
- **Vercel** - Frontend hosting (free tier)
- **Heroku** - Backend hosting with PostgreSQL
- **GitHub** - Version control

## 🎮 How to Play

1. **Register** an account on the live site
2. **Start a quiz** and analyze the Bitcoin chart
3. **Make predictions** - buy when you think price will go up, sell when you think it will go down
4. **Earn ELO points** based on your accuracy
5. **Climb the leaderboard** and compete with other traders

## 🚀 Quick Start (Development)

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Environment Variables
Create `.env.local` in frontend:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Create `.env` in backend:
```
NODE_ENV=development
JWT_SECRET=your-secret-key
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=trading_quiz
```

## 📁 Project Structure

```
trading-quiz/
├── frontend/          # Next.js frontend
│   ├── src/
│   │   ├── app/      # App Router pages
│   │   └── components/
└── backend/           # Express.js API
    ├── src/
    │   ├── routes/   # API endpoints
    │   ├── entities/ # Database models
    │   └── middleware/
```

## 🏆 Live Leaderboard

Visit the [live website](https://trading-quiz-pppdtyjb9-harshsingh711s-projects.vercel.app) to see current rankings and compete with traders worldwide!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**🎯 Ready to test your trading skills? [Play Now!](https://trading-quiz-pppdtyjb9-harshsingh711s-projects.vercel.app)** 