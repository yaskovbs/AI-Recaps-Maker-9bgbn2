import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const Home = lazy(() => import('@/pages/Home'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Create = lazy(() => import('@/pages/Create'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Wallet = lazy(() => import('@/pages/Wallet'));
const YouTubeLearning = lazy(() => import('@/pages/YouTubeLearning'));
const Settings = lazy(() => import('@/pages/Settings'));
const Leaderboard = lazy(() => import('@/pages/Leaderboard'));
const MyRecaps = lazy(() => import('@/pages/MyRecaps'));
const Login = lazy(() => import('@/pages/Login'));
const Signup = lazy(() => import('@/pages/Signup'));
const Terms = lazy(() => import('@/pages/Terms'));
const Privacy = lazy(() => import('@/pages/Privacy'));
const FAQ = lazy(() => import('@/pages/FAQ'));
const Contact = lazy(() => import('@/pages/Contact'));
const Gallery = lazy(() => import('@/pages/Gallery'));
const MyVideos = lazy(() => import('@/pages/MyVideos'));
const Disclaimer = lazy(() => import('@/pages/Disclaimer'));
const NotFound = lazy(() => import('@/pages/NotFound'));

const privateRoutes: Array<[string, LazyExoticComponent<ComponentType>]> = [
  ['/dashboard', Dashboard], ['/create', Create], ['/my-recaps', MyRecaps],
  ['/my-videos', MyVideos], ['/analytics', Analytics], ['/wallet', Wallet],
  ['/youtube-learning', YouTubeLearning], ['/settings', Settings],
];

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-live="polite">
      <Loader2 className="h-8 w-8 animate-spin text-brass-300" aria-hidden="true" />
      <span className="sr-only">Loading page</span>
    </div>
  );
}

function App() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0a0a14' }}>
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/disclaimer" element={<Disclaimer />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            {privateRoutes.map(([path, Page]) => (
              <Route key={path} path={path} element={<ProtectedRoute><Page /></ProtectedRoute>} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export default App;
