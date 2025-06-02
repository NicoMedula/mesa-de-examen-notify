import React, { useState } from "react";
import { Link } from "react-router-dom";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage({
        text: "Por favor, ingrese su correo electrónico",
        type: "error"
      });
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    try {
      const response = await fetch("http://localhost:3001/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email }),
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
        throw new Error(data.error || "Error al solicitar restablecimiento de contraseña");
      }
      
      setMessage({
        text: "Se ha enviado un correo electrónico con instrucciones para restablecer su contraseña",
        type: "success"
      });
    } catch (error: any) {
      setMessage({
        text: error.message || "Ocurrió un error al procesar su solicitud",
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
              <h4>Recuperar Contraseña</h4>
            </div>
            <div className="card-body">
              {message && (
                <div className={`alert ${message.type === "success" ? "alert-success" : "alert-danger"}`}>
                  {message.text}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ingrese su correo electrónico"
                    disabled={loading}
                  />
                  <div className="form-text">
                    Ingrese el correo electrónico asociado a su cuenta de docente.
                  </div>
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
                        Enviando...
                      </>
                    ) : (
                      "Enviar Instrucciones"
                    )}
                  </button>
                </div>
              </form>
              
              <div className="mt-3 text-center">
                <Link to="/login" className="text-decoration-none">
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
