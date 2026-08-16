import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ModulePage from './pages/ModulePage';
import AppLayout from './layouts/AppLayout';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('sisq_token');
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="modulo/:resource" element={<ModulePage />} />
      </Route>
    </Routes>
  );
}
