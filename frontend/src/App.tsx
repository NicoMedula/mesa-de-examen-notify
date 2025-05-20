import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import "bootstrap/dist/css/bootstrap.min.css";
import DepartamentoDashboard from "./components/DepartamentoDashboard";
import DocenteDashboard from "./components/DocenteDashboard";

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/departamento" element={<DepartamentoDashboard />} />
        <Route path="/docente" element={<DocenteDashboard />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* Aquí agregaremos más rutas cuando las creemos */}
      </Routes>
    </Router>
  );
};

export default App;
