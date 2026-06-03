import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Pages
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Create from '@/pages/Create';
import Analytics from '@/pages/Analytics';
import Wallet from '@/pages/Wallet';
import YouTubeLearning from '@/pages/YouTubeLearning';
import Settings from '@/pages/Settings';
import Leaderboard from '@/pages/Leaderboard';
import MyRecaps from '@/pages/MyRecaps';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Terms from '@/pages/Terms';
import Privacy from '@/pages/Privacy';
import FAQ from '@/pages/FAQ';
import Contact from '@/pages/Contact';
import Gallery from '@/pages/Gallery';
import MyVideos from '@/pages/MyVideos';
import Disclaimer from '@/pages/Disclaimer';
import NotFound from '@/pages/NotFound';

function App() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0a14' }}>
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<Create />} />
          <Route path="/my-recaps" element={<MyRecaps />} />
          <Route path="/my-videos" element={<MyVideos />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/youtube-learning" element={<YouTubeLearning />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
