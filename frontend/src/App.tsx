import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";
import Login from "./components/Login";
import "bootstrap/dist/css/bootstrap.min.css";
import DepartamentoDashboard from "./components/DepartamentoDashboard";
import DocenteDashboard from "./components/DocenteDashboard";

// Componente para gestionar y aislar el almacenamiento para cada ruta
const RouteStorageManager = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  
  // Gestionar el almacenamiento según la ruta actual
  useEffect(() => {
    // Guardar identificador de ruta en sessionStorage para mantener sesiones aisladas
    const path = location.pathname;
    if (path === '/docente') {
      // Asegurar que no interfiera con sesiones del departamento
      sessionStorage.setItem('currentPath', 'docente');
    } else if (path === '/departamento') {
      // Asegurar que no interfiera con sesiones del docente
      sessionStorage.setItem('currentPath', 'departamento');
    }
  }, [location]);
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <RouteStorageManager>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/departamento" element={<DepartamentoDashboard />} />
          <Route path="/docente" element={<DocenteDashboard />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          {/* Aquí agregaremos más rutas cuando las creemos */}
        </Routes>
      </RouteStorageManager>
    </Router>
  );
};

export default App;
