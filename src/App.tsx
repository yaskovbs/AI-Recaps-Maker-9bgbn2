import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import ErrorBoundary from '@/components/ErrorBoundary';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Lazy-loaded pages for code splitting
const Home = React.lazy(() => import('@/pages/Home'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Create = React.lazy(() => import('@/pages/Create'));
const Analytics = React.lazy(() => import('@/pages/Analytics'));
const Wallet = React.lazy(() => import('@/pages/Wallet'));
const YouTubeLearning = React.lazy(() => import('@/pages/YouTubeLearning'));
const Settings = React.lazy(() => import('@/pages/Settings'));
const Leaderboard = React.lazy(() => import('@/pages/Leaderboard'));
const MyRecaps = React.lazy(() => import('@/pages/MyRecaps'));
const Login = React.lazy(() => import('@/pages/Login'));
const Signup = React.lazy(() => import('@/pages/Signup'));
const Terms = React.lazy(() => import('@/pages/Terms'));
const Privacy = React.lazy(() => import('@/pages/Privacy'));
const FAQ = React.lazy(() => import('@/pages/FAQ'));
const Contact = React.lazy(() => import('@/pages/Contact'));
const Gallery = React.lazy(() => import('@/pages/Gallery'));
const RecapView = React.lazy(() => import('@/pages/RecapView'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brass-500/30 border-t-brass-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-brass-300 text-sm">טוען...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-steampunk-gradient">
      <Header />
      <main className="flex-1">
        <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<Create />} />
            <Route path="/my-recaps" element={<MyRecaps />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/youtube-learning" element={<YouTubeLearning />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/recap/:id" element={<RecapView />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<div className="container mx-auto px-4 py-20 text-center text-brass-200">404 - Page Not Found</div>} />
          </Routes>
        </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <Toaster
        position="top-center"
        richColors
        dir="rtl"
        toastOptions={{
          style: {
            background: '#1a1510',
            border: '1px solid rgba(212, 124, 71, 0.3)',
            color: '#d4a574',
          },
        }}
      />
    </div>
  );
}

export default App;
