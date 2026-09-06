import React, { Suspense, lazy } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import RecruiterDashboard from './components/RecruiterDashboard';
import AddCandidate from './components/AddCandidateForm';
import Positions from './components/Positions';

// El detalle de posición solo se descarga al entrar en la ruta: mantiene fuera del
// bundle inicial el tablero y su CSS, que la mayoría de visitas no llega a abrir.
const PositionDetail = lazy(() => import('./components/PositionDetail'));

const RouteFallback = () => (
  <div className="text-center py-5" aria-busy="true">
    <Spinner animation="border" role="status">
      <span className="visually-hidden">Cargando…</span>
    </Spinner>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<RecruiterDashboard />} />
          <Route path="/add-candidate" element={<AddCandidate />} /> {/* Agrega esta línea */}
          <Route path="/positions" element={<Positions />} />
          <Route path="/positions/:id" element={<PositionDetail />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;