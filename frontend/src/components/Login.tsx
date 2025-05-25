import React, { useState } from "react";
import { UserRole } from "../types/user";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate, Link } from "react-router-dom";

const FIXED_PASSWORD = "12345"; // Contraseña preestablecida

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Constante para el email del departamento
  const DEPARTAMENTO_EMAIL = "departamento@ejemplo.com";

  // No necesitamos cargar la lista de docentes por adelantado
  // La autenticación se hará al momento de enviar el formulario

  const API_URL = process.env.REACT_APP_API_URL;

  // Función para verificar credenciales y login con docente
  const handleDocenteLogin = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Verificar que la contraseña sea correcta (es fija para todos)
      if (password !== FIXED_PASSWORD) {
        setError("Contraseña incorrecta");
        setLoading(false);
        return;
      }

      // Buscar docente por email en la API
      const response = await fetch(`${API_URL}/api/docentes`);
      if (!response.ok) {
        throw new Error("Error al verificar credenciales");
      }

      const docentes = await response.json();
      console.log("Docentes obtenidos:", docentes);

      // Comprobación exacta del email
      const docente = docentes.find(
        (d: any) => d.email.toLowerCase().trim() === email.toLowerCase().trim()
      );

      // Log detallado para debugging
      console.log("Email buscado:", email);
      console.log("Docente encontrado:", docente);
      console.log("ID del docente en la base de datos:", docente?.id);

      if (!docente) {
        setError("No se encontró un docente con ese correo electrónico");
        setLoading(false);
        return;
      }

      // Limpiar datos anteriores
      sessionStorage.clear();
      localStorage.removeItem("departamentoId");

      // Establecer datos de sesión para este docente
      const sessionId = `${docente.nombre
        .toLowerCase()
        .replace(/ /g, "_")}_${Date.now()}`;
      sessionStorage.setItem("sessionId", sessionId);
      sessionStorage.setItem("currentUser", docente.nombre);
      sessionStorage.setItem("userRole", "docente");
      sessionStorage.setItem("docenteId", docente.id);

      // También almacenar en localStorage para compatibilidad
      localStorage.setItem("docenteId", docente.id);
      localStorage.setItem("userName", docente.nombre);

      console.log(
        `Iniciando sesión como ${docente.nombre} con ID ${docente.id}`
      );
      setLoading(false);
      navigate("/docente");
    } catch (error: any) {
      console.error("Error en la autenticación:", error);
      setError(error?.message || "Error al iniciar sesión");
      setLoading(false);
    }
  };

  const handleDepartamentoLogin = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Validar contraseña para el departamento
      if (password !== FIXED_PASSWORD) {
        setError("Contraseña incorrecta");
        setLoading(false);
        return;
      }

      // Verificar que el correo sea el correcto para el departamento
      if (email !== "departamento@ejemplo.com") {
        setError("Correo electrónico de departamento incorrecto");
        setLoading(false);
        return;
      }

      // Limpiar datos anteriores
      sessionStorage.clear();
      localStorage.removeItem("docenteId");
      localStorage.removeItem("userName");

      // Establecer datos de sesión únicos para el departamento
      const sessionId = `depto_${Date.now()}`;
      sessionStorage.setItem("sessionId", sessionId);
      sessionStorage.setItem("currentUser", "Departamento");
      sessionStorage.setItem("userRole", "departamento");
      sessionStorage.setItem(
        "departamentoId",
        "2c5ea4c0-4067-11ed-b878-0242ac120002"
      );

      // También almacenar en localStorage para compatibilidad
      localStorage.setItem(
        "departamentoId",
        "2c5ea4c0-4067-11ed-b878-0242ac120002"
      );

      setLoading(false);
      navigate("/departamento");
    } catch (error: any) {
      console.error("Error en la autenticación del departamento:", error);
      setError(error?.message || "Error al iniciar sesión");
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // Validar campos
      if (!email.trim()) {
        setError("Por favor, ingrese su correo electrónico");
        return;
      }

      if (!password.trim()) {
        setError("Por favor, ingrese su contraseña");
        return;
      }

      // Determinar el rol automáticamente basado en el correo electrónico
      const emailNormalizado = email.toLowerCase().trim();
      
      if (emailNormalizado === DEPARTAMENTO_EMAIL.toLowerCase()) {
        // Es el departamento
        await handleDepartamentoLogin(email, password);
      } else {
        // Cualquier otro correo se considera como docente
        await handleDocenteLogin(email, password);
      }
    } catch (error: any) {
      setError(error.message || "Error al iniciar sesión");
    }
  };

  return (
    <div className="container-fluid my-3 my-md-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
          <div className="card shadow">
            <div className="card-body p-3 p-md-4">
              <h2 className="card-title text-center mb-4">Iniciar Sesión</h2>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handleLogin}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="mt-1 text-end">
                    <Link to="/forgot-password" className="text-decoration-none small">
                      ¿Olvidó su contraseña?
                    </Link>
                  </div>
                </div>
                {/* Mensaje informativo */}
                <div className="mb-3">
                  <small className="form-text text-muted">
                    Para departamento use: departamento@ejemplo.com<br/>
                    Para docentes use su correo electrónico institucional
                  </small>
                </div>

                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Iniciando sesión...
                      </>
                    ) : (
                      "Iniciar Sesión"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
