import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Login from "./components/Login";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import DepartamentoDashboard from "./components/DepartamentoDashboard";
import DocenteDashboard from "./components/DocenteDashboard";
import { Helmet } from "react-helmet";

// Componente para gestionar y aislar el almacenamiento para cada ruta
const RouteStorageManager = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  // Gestionar el almacenamiento según la ruta actual
  useEffect(() => {
    // Guardar identificador de ruta en sessionStorage para mantener sesiones aisladas
    const path = location.pathname;
    if (path === "/docente") {
      // Asegurar que no interfiera con sesiones del departamento
      sessionStorage.setItem("currentPath", "docente");
    } else if (path === "/departamento") {
      // Asegurar que no interfiera con sesiones del docente
      sessionStorage.setItem("currentPath", "departamento");
    }
  }, [location]);

  return <>{children}</>;
};

// Estilos globales para mejorar la responsividad
const globalStyles = `
  @media (max-width: 576px) {
    .container-fluid {
      padding-left: 10px;
      padding-right: 10px;
    }
    
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
    }
  }
  
  body {
    overflow-x: hidden;
  }
  
  .table-responsive {
    margin-bottom: 1rem;
  }
`;

const App: React.FC = () => {
  return (
    <Router>
      <Helmet>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <style>{globalStyles}</style>
      </Helmet>
      <RouteStorageManager>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/departamento" element={<DepartamentoDashboard />} />
          <Route path="/docente" element={<DocenteDashboard />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </RouteStorageManager>
    </Router>
  );
};

export default App;
