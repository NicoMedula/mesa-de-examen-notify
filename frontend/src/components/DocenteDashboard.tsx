import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

interface Mesa {
  id: string;
  materia: string;
  fecha: string;
  hora: string;
  aula: string;
  docentes: { id: string; nombre: string; confirmacion: string }[];
}

const docenteId = localStorage.getItem("docenteId") || ""; // O reemplaza por el id real del docente logueado

const DocenteDashboard: React.FC = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://192.168.0.6:3001/api/docente/${docenteId}/mesas`)
      .then((res) => res.json())
      .then((data) => {
        setMesas(data);
        setLoading(false);
      });
  }, []);

  const handleConfirm = async (
    mesaId: string,
    confirmacion: "aceptado" | "rechazado"
  ) => {
    setError(null);
    const res = await fetch(
      `http://192.168.0.6:3001/api/mesa/${mesaId}/docente/${docenteId}/confirmar`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmacion }),
      }
    );
    if (!res.ok) {
      setError("Error al actualizar la confirmación");
      return;
    }
    // Refrescar mesas
    fetch(`http://192.168.0.6:3001/api/docente/${docenteId}/mesas`)
      .then((res) => res.json())
      .then(setMesas);
  };

  return (
    <div className="container mt-4">
      <h2>Mis Mesas Asignadas</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Materia</th>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Aula</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(mesas) &&
              mesas.map((mesa) => {
                const docente = mesa.docentes.find((d) => d.id === docenteId);
                if (!docente) return null;
                const rol =
                  mesa.docentes[0].id === docenteId ? "Titular" : "Vocal";
                return (
                  <tr key={mesa.id}>
                    <td>{mesa.materia || "-"}</td>
                    <td>{mesa.fecha}</td>
                    <td>{mesa.hora}</td>
                    <td>{mesa.aula}</td>
                    <td>{rol}</td>
                    <td>{docente.confirmacion}</td>
                    <td>
                      {docente.confirmacion === "pendiente" ? (
                        <>
                          <button
                            className="btn btn-success btn-sm me-2"
                            onClick={() => handleConfirm(mesa.id, "aceptado")}
                          >
                            Aceptar
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleConfirm(mesa.id, "rechazado")}
                          >
                            Rechazar
                          </button>
                        </>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DocenteDashboard;
