import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate, Link } from "react-router-dom";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Asegurarnos de que tenemos una URL de API válida
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";
  console.log("URL de API para login:", API_URL);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (!email.trim()) {
        setError("Por favor, ingrese su correo electrónico");
        return;
      }
      if (!password.trim()) {
        setError("Por favor, ingrese su contraseña");
        return;
      }
      setLoading(true);
      console.log("Iniciando proceso de login...");

      // Determinar el rol automáticamente basado en el correo electrónico
      let role = "docente";
      if (email.toLowerCase().trim() === "departamento@ejemplo.com") {
        role = "departamento";
      }

      console.log(`Intentando login con email: ${email}, rol: ${role}`);
      console.log(`URL completa: ${API_URL}/api/login`);

      // Primero verificamos que la API esté accesible
      try {
        const pingResponse = await fetch(`${API_URL}/api/push/status`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (pingResponse.ok) {
          console.log("API está accesible, procediendo con el login");
        } else {
          console.warn("API no respondió correctamente al ping");
        }
      } catch (pingError) {
        console.error("Error al verificar estado de API:", pingError);
        // Continuamos con el login de todas formas
      }

      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password, role }),
        mode: "cors",
      });

      // Para debugging
      console.log(
        `Respuesta del servidor: ${response.status} ${response.statusText}`
      );

      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error("Error al parsear respuesta JSON:", e);
        throw new Error("Error al procesar la respuesta del servidor");
      }

      if (!response.ok) {
        console.error("Error de login:", data);
        throw new Error(data.error || "Error al iniciar sesión");
      }

      console.log("Login exitoso:", data);
      // Guardar datos de sesión
      sessionStorage.clear();
      localStorage.clear();
      sessionStorage.setItem("sessionId", data.user.id);
      sessionStorage.setItem("currentUser", data.user.email);
      sessionStorage.setItem("userRole", role);
      if (role === "docente") {
        sessionStorage.setItem("docenteId", data.user.id);
        localStorage.setItem("docenteId", data.user.id);
        localStorage.setItem("userName", data.user.email);
        navigate("/docente");
      } else {
        sessionStorage.setItem("departamentoId", data.user.id);
        localStorage.setItem("departamentoId", data.user.id);
        navigate("/departamento");
      }
      setLoading(false);
    } catch (error: any) {
      setError(error.message || "Error al iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid my-3 my-md-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
          <div className="d-flex flex-column align-items-center mb-3">
            <img
              src="/image/logoUCP.png"
              alt="Logo UCP"
              style={{
                height: 100,
                width: "auto",
                maxWidth: 220,
                objectFit: "contain",
              }}
            />
          </div>
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
