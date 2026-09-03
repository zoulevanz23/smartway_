import { Routes, Route } from 'react-router-dom';
import './App.css';
import { AuroraBackground } from './components/AuroraBackground';
import { Home } from './pages/Home';
import { About } from './pages/About';
import { AppPage } from './pages/AppPage';
import { SummaryPage } from './pages/SummaryPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { QuizPage } from './pages/QuizPage';

function App() {
  return (
    <>
      <AuroraBackground />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/app" element={<AppPage />} />
        <Route path="/summary" element={<SummaryPage />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/quiz" element={<QuizPage />} />
      </Routes>
    </>
  );
}

export default App;
