import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import MysteryPage from './pages/MysteryPage.jsx';

function NotFound() {
  return (
    <main className="page page-center">
      <h1>Page not found</h1>
      <Link to="/" className="button">Back to the start</Link>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/mystery/:id" element={<MysteryPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
