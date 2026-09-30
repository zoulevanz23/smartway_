import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuroraBackground } from './components/AuroraBackground';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { AppPage } from './pages/AppPage';
import { SummaryPage } from './pages/SummaryPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { QuizPage } from './pages/QuizPage';
import { PackPage } from './pages/PackPage';

function App() {
  return (
    <>
      <AuroraBackground />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/app" element={<AppPage />} />
        <Route path="/pack/:slug" element={<PackPage />} />
        {/* TabSelector links to /pack/:slug/<tab> whenever a slug is present, so
            the slug-scoped variants must exist or the top bar renders nothing. */}
        <Route path="/pack/:slug/summary" element={<SummaryPage />} />
        <Route path="/pack/:slug/flashcards" element={<FlashcardsPage />} />
        <Route path="/pack/:slug/quiz" element={<QuizPage />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </>
  );
}

export default App;
