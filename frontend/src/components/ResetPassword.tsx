import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    // Extraer el token del query string
    const query = new URLSearchParams(location.search);
    const tokenFromUrl = query.get("token");
    
    if (!tokenFromUrl) {
      setMessage({
        text: "Token de recuperaciu00f3n no vu00e1lido o expirado",
        type: "error"
      });
    } else {
      setToken(tokenFromUrl);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!password.trim()) {
      setMessage({
        text: "Por favor, ingrese una contraseu00f1a nueva",
        type: "error"
      });
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage({
        text: "Las contraseu00f1as no coinciden",
        type: "error"
      });
      return;
    }
    
    if (password.length < 6) {
      setMessage({
        text: "La contraseu00f1a debe tener al menos 6 caracteres",
        type: "error"
      });
      return;
    }
    
    if (!token) {
      setMessage({
        text: "Token de recuperaciu00f3n no vu00e1lido o expirado",
        type: "error"
      });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch("http://localhost:3001/api/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ token, password }),
      });
      
      // Validar que la respuesta sea JSON antes de parsearla
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Respuesta no-JSON recibida:", text);
        throw new Error("El servidor no respondió con un formato válido");
      }
      
      if (!response.ok) {
        throw new Error(data.error || "Error al restablecer la contraseu00f1a");
      }
      
      setMessage({
        text: "Su contraseu00f1a ha sido restablecida exitosamente",
        type: "success"
      });
      
      // Redirigir al login despuu00e9s de 3 segundos
      setTimeout(() => {
        navigate("/login");
      }, 3000);
      
    } catch (error: any) {
      setMessage({
        text: error.message || "Ocurriu00f3 un error al procesar su solicitud",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white text-center">
              <h4>Restablecer Contraseu00f1a</h4>
            </div>
            <div className="card-body">
              {message && (
                <div className={`alert ${message.type === "success" ? "alert-success" : "alert-danger"}`}>
                  {message.text}
                </div>
              )}
              
              {token && !(message?.type === "success") && (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      Nueva Contraseu00f1a
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirmar Contraseu00f1a
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
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
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Procesando...
                        </>
                      ) : (
                        "Restablecer Contraseu00f1a"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
