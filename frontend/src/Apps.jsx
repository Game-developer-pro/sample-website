import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";

// Lazy-loaded route components for fast startup & low memory consumption on budget devices
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/Dashboard"));
const QuestionsPage = lazy(() => import("./pages/QuestionsPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const CorrectionsPage = lazy(() => import("./pages/CorrectionsPage"));
const AddQuestionPage = lazy(() => import("./pages/AddQuestionPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NewsFeedPage = lazy(() => import("./pages/NewsFeedPage"));
const CreatePostPage = lazy(() => import("./pages/CreatePostPage"));
const PracticalsPage = lazy(() => import("./pages/PracticalsPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));
const AdminFeedbackPage = lazy(() => import("./pages/AdminFeedbackPage"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));
const GamesPage = lazy(() => import("./pages/GamesPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));

// Lightweight fallback loader with minimal CPU overhead
const PageLoader = () => (
  <div style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "12px",
    color: "hsl(var(--text-muted))"
  }}>
    <div style={{
      width: "36px",
      height: "36px",
      border: "3px solid hsla(var(--primary), 0.2)",
      borderTopColor: "hsl(var(--primary))",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite"
    }} />
    <span style={{ fontSize: "0.88rem", letterSpacing: "0.02em" }}>Loading...</span>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/questions" element={<QuestionsPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/corrections/:id" element={<CorrectionsPage />} />
            <Route path="/add-question" element={<AddQuestionPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/news-feed" element={<NewsFeedPage />} />
            <Route path="/create-post" element={<CreatePostPage />} />
            <Route path="/practicals" element={<PracticalsPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/feedback" element={<AdminFeedbackPage />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/payment" element={<PaymentPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
