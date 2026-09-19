import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import { ToastProvider } from "./components/ui";
import Home from "./pages/Home";
import Games from "./pages/Games";
import GameDetails from "./pages/GameDetails";
import QuizGame from "./pages/QuizGame";
import PuzzleGame from "./pages/PuzzleGame";
import Learn from "./pages/Learn";
import LearnTopic from "./pages/LearnTopic";
import Leaderboard from "./pages/Leaderboard";
import Achievements from "./pages/Achievements";
import Profile from "./pages/Profile";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

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

      <Route path="/learn" element={<Learn />} />

      <Route path="/learn/:slug" element={<LearnTopic />} />

      <Route path="/leaderboard" element={<Leaderboard />} />

      <Route path="/achievements" element={<Achievements />} />

      <Route path="/profile" element={<Profile />} />

      <Route path="/about" element={<About />} />

      <Route path="*" element={<NotFound />} />
      
    </Routes>
  );
  return (
    <ToastProvider>
      {immersive ? content : <Layout>{content}</Layout>}
    </ToastProvider>
  );
}
