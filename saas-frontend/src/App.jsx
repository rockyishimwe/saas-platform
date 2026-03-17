import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import Dashboard from './pages/Dashboard'
import FeedbackForm from './pages/FeedbackForm'
import FeedbackList from './pages/FeedbackList'
import Analytics from './pages/Analytics'
import TeamManagement from './pages/TeamManagement'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/feedback/new" element={<FeedbackForm />} />
        <Route path="/feedback" element={<FeedbackList />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/team" element={<TeamManagement />} />
      </Routes>
    </div>
  )
}

export default App
