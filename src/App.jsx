import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { NewOrder } from './pages/NewOrder';
import { History } from './pages/History';
import { Blog } from './pages/Blog';
import { Profile } from './pages/Profile';
import { Contact } from './pages/Contact';
import { Legal } from './pages/Legal';
import { AdminDashboard } from './pages/AdminDashboard';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { BizumPayment } from './pages/BizumPayment';

/**
 * Componente Principal App
 * 
 * Gestiona el enrutamiento global, la persistencia del Layout y el sistema 
 * de cambio automático de tema (Día/Noche).
 */
function App() {
  /**
   * EFECTO: Sistema de Tematización Dinámica.
   * Alterna automáticamente entre light-theme y dark-theme según la hora del día.
   */
  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      // El tema claro se activa de 7:00 a 19:00
      const isDayTime = hour >= 7 && hour < 19;

      if (isDayTime) {
        document.body.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
      }
    };

    updateTheme();
    // Re-comprobar cada minuto por si ha cambiado de franja horaria el sistema
    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* RUTAS DE AUTENTICACION (Fuera del Layout principal) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* RUTAS DE LA APLICACIÓN (Bajo el shell del Layout) */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="new-order" element={<NewOrder />} />
          <Route path="history" element={<History />} />
          <Route path="blog" element={<Blog />} />
          <Route path="profile" element={<Profile />} />
          <Route path="contact" element={<Contact />} />
          <Route path="legal" element={<Legal />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="bizum-payment" element={<BizumPayment />} />
        </Route>

        {/* FALLBACK: Redirección a Home para cualquier ruta no válida */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
