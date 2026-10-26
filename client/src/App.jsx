import { Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<h1>AI Mystery Room</h1>} />
      <Route path="*" element={<h1>Page not found</h1>} />
    </Routes>
  );
}
