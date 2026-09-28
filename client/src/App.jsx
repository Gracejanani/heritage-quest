import React, { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import { ToastProvider } from "./components/ui";
import Home from "./pages/Home";
import Games from "./pages/Games";
import GameDetails from "./pages/GameDetails";
import QuizGame from "./pages/QuizGame";
import PuzzleGame from "./pages/PuzzleGame";
import WordQuestGame from "./pages/WordQuestGame";
import Learn from "./pages/Learn";
import LearnTopic from "./pages/LearnTopic";
import Leaderboard from "./pages/Leaderboard";
import Achievements from "./pages/Achievements";
import Profile from "./pages/Profile";
import StudentSettings from "./pages/StudentSettings";
import About from "./pages/About";
import Certificate from "./pages/Certificate";
import NotFound from "./pages/NotFound";
import AuthGate from "./components/AuthGate";
import AdminGuard from "./components/AdminGuard";
import TeacherGuard from "./components/TeacherGuard";
import { PlayerProvider } from "./context/PlayerContext";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import HeritageChatbot from "./components/HeritageChatbot";

const Admin = lazy(() => import("./pages/Admin"));
const TeacherDashboard = lazy(() => import("./pages/TeacherDashboard"));

function DashboardFallback() {
  return (
    <div className="container-app py-20 text-center font-bold text-slate-600">
      Loading dashboard…
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const immersive = pathname.startsWith("/play/");
  const content = (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/games" element={<Games />} />

      <Route path="/games/:slug" element={<GameDetails />} />

      <Route path="/play/quiz/:chapterSlug" element={<QuizGame />} />

      <Route path="/play/quiz" element={<QuizGame />} />

      <Route path="/play/puzzle" element={<PuzzleGame />} />

      <Route path="/play/word-quest" element={<WordQuestGame />} />

      <Route path="/learn" element={<Learn />} />

      <Route path="/learn/:slug" element={<LearnTopic />} />

      <Route path="/leaderboard" element={<Leaderboard />} />

      <Route path="/achievements" element={<Achievements />} />

      <Route path="/profile" element={<Profile />} />

      <Route path="/settings" element={<StudentSettings />} />

      <Route path="/certificate/:chapterSlug" element={<Certificate />} />

      <Route path="/about" element={<About />} />

      <Route
        path="/admin"
        element={
          <AdminGuard>
            <Suspense fallback={<DashboardFallback />}>
              <Admin />
            </Suspense>
          </AdminGuard>
        }
      />

      <Route
        path="/teacher"
        element={
          <TeacherGuard>
            <Suspense fallback={<DashboardFallback />}>
              <TeacherDashboard />
            </Suspense>
          </TeacherGuard>
        }
      />

      <Route path="*" element={<NotFound />} />
      
    </Routes>
  );
  return (
    <ToastProvider>
      <LanguageProvider>
        <AuthProvider>
          <PlayerProvider>
            <AuthGate>
              {immersive ? content : <Layout>{content}</Layout>}
            </AuthGate>
            <HeritageChatbot />
          </PlayerProvider>
        </AuthProvider>
      </LanguageProvider>
    </ToastProvider>
  );
}
