import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

interface Mesa {
  id: string;
  materia: string;
  fecha: string;
  hora: string;
  aula: string;
  docentes: { id: string; nombre: string; confirmacion: string }[];
  estado?: "pendiente" | "confirmada" | "cancelada";
  docente_titular?: string;
  docente_vocal?: string;
}

const DocenteDashboard: React.FC = () => {
  // Estado
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesasConfirmadas, setMesasConfirmadas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docenteNombre, setDocenteNombre] = useState<string>("");
  const [docenteId, setDocenteId] = useState<string>("");

  const API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    // Obtener el ID del docente desde sessionStorage (prioridad) o localStorage
    const storedDocenteId =
      sessionStorage.getItem("docenteId") || localStorage.getItem("docenteId");
    const storedUserName =
      sessionStorage.getItem("currentUser") || localStorage.getItem("userName");

    // Log para debugging de los IDs
    console.log(
      "ID almacenado en sessionStorage:",
      sessionStorage.getItem("docenteId")
    );
    console.log(
      "ID almacenado en localStorage:",
      localStorage.getItem("docenteId")
    );
    console.log("ID que se usará:", storedDocenteId);

    if (!storedDocenteId) {
      setError(
        "No se encontró ID de docente en la sesión. Por favor, inicie sesión nuevamente."
      );
      setLoading(false);
      return;
    }

    // Establecer el ID del docente
    setDocenteId(storedDocenteId);

    // Inicialmente establecer el nombre desde el almacenamiento
    if (storedUserName) {
      setDocenteNombre(storedUserName);
    }

    // Obtener información detallada del docente desde la API
    const fetchDocenteInfo = async () => {
      try {
        const response = await fetch(`${API_URL}/api/docentes`);
        if (response.ok) {
          const docentes = await response.json();

          const docente = docentes.find((d: any) => d.id === storedDocenteId);
          if (docente) {
            setDocenteNombre(docente.nombre);
            // Actualizar el storage con el nombre correcto
            sessionStorage.setItem("currentUser", docente.nombre);
            localStorage.setItem("userName", docente.nombre);

            // Una vez que tenemos el ID y el nombre, cargar las mesas
            // Pasamos el ID explícitamente para evitar problemas de timing con useState
            await refreshMesas(storedDocenteId);
            console.log("Mesas cargadas exitosamente con ID:", storedDocenteId);
          } else {
            console.warn("No se encontró docente con el ID:", storedDocenteId);
            setError(
              "No se encontró información del docente. Por favor, inicie sesión nuevamente."
            );
            setLoading(false);
          }
        } else {
          setError(
            "Error al obtener información de docentes. Por favor, intente más tarde."
          );
          setLoading(false);
        }
      } catch (error) {
        console.error("Error al obtener información del docente:", error);
        setError("Error de conexión. Por favor, intente más tarde.");
        setLoading(false);
      }
    };

    fetchDocenteInfo();

    // Establecer intervalo para actualizar periódicamente
    const intervalId = setInterval(() => {
      if (docenteId) {
        // Solo refrescar si hay un ID de docente disponible
        refreshMesas();
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, []); // Solo se ejecuta una vez al montar el componente

  const refreshMesas = async (idToUse = docenteId) => {
    const docenteIdActual =
      idToUse ||
      docenteId ||
      sessionStorage.getItem("docenteId") ||
      localStorage.getItem("docenteId");

    if (!docenteIdActual) {
      console.error("No hay ID de docente disponible para refrescar mesas");
      return;
    }

    try {
      console.log("Obteniendo mesas para docente ID:", docenteIdActual);
      // Agregamos un timestamp para evitar el caché
      const timestamp = new Date().getTime();
      const res = await fetch(
        `${API_URL}/api/docente/${docenteIdActual}/mesas?t=${timestamp}`
      );
      if (!res.ok) {
        console.error("Error al refrescar las mesas:", res.status);
        return;
      }
      const data = await res.json();

      if (Array.isArray(data)) {
        console.log(
          "%c Mesas recibidas del servidor: ",
          "background: #5cb85c; color: white; font-weight: bold",
          data.length
        );

        // Logear todas las mesas y sus docentes para depurar
        data.forEach((mesa) => {
          const estadoColor =
            mesa.estado === "confirmada"
              ? "color: green; font-weight: bold"
              : "color: orange";
          console.log(
            `Mesa ID: ${mesa.id}, Materia: %c${mesa.materia}%c, Estado: %c${
              mesa.estado || "sin estado"
            }`,
            "color: blue",
            "color: black",
            estadoColor
          );

          console.group("Docentes asignados:");
          if (mesa.docentes && Array.isArray(mesa.docentes)) {
            mesa.docentes.forEach((d: any) => {
              const esEsteDocente = d.id === docenteIdActual ? "👉 " : "  - ";
              console.log(
                `${esEsteDocente}ID: ${d.id}, Nombre: ${d.nombre}, Confirmacion: ${d.confirmacion}`
              );
            });
          } else {
            console.log(
              "  No hay docentes asignados o el formato es incorrecto"
            );
          }
          console.groupEnd();
        });

        // Simplemente mostrar todas las mesas donde el docente aparece
        const todasMesasDelDocente = data.filter(
          (mesa) =>
            mesa.docentes &&
            Array.isArray(mesa.docentes) &&
            mesa.docentes.some((d: any) => d.id === docenteIdActual)
        );

        console.log(
          `%c Total mesas encontradas para el docente ${docenteIdActual}: ${todasMesasDelDocente.length}`,
          "background: #f0ad4e; color: white; font-weight: bold"
        );

        // Dividir por estado de la mesa (no por estado del docente)
        const mesasConfirmadas = todasMesasDelDocente.filter((mesa) => {
          const esConfirmada = mesa.estado === "confirmada";
          console.log(
            `Mesa ${mesa.id} (${mesa.materia}): estado = ${
              mesa.estado
            }, ¿es confirmada? ${esConfirmada ? "SÍ" : "NO"}`
          );
          return esConfirmada;
        });

        const mesasPendientes = todasMesasDelDocente.filter(
          (mesa) => mesa.estado !== "confirmada"
        );

        console.log(
          `%c Mesas confirmadas: ${mesasConfirmadas.length}, Mesas pendientes: ${mesasPendientes.length}`,
          "background: #5bc0de; color: white; font-weight: bold"
        );

        // Debug: mostrar las mesas confirmadas en detalle
        if (mesasConfirmadas.length > 0) {
          console.group(
            "%c DETALLE DE MESAS CONFIRMADAS",
            "background: green; color: white;"
          );
          mesasConfirmadas.forEach((mesa) => {
            console.log(
              `Mesa confirmada: ID=${mesa.id}, Materia=${mesa.materia}, Estado EXACTO='${mesa.estado}'`
            );
          });
          console.groupEnd();
        }

        setMesasConfirmadas(mesasConfirmadas);
        setMesas(mesasPendientes);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error al refrescar las mesas:", error);
      setLoading(false);
    }
  };

  const handleConfirm = async (
    mesaId: string,
    confirmacion: "aceptado" | "rechazado" | "pendiente"
  ) => {
    try {
      setError(null);
      console.log(
        `Docente ${docenteId} - Cambiando estado de mesa ${mesaId} a: ${confirmacion}`
      );

      // Crear un controlador para abortar la petición si tarda demasiado
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

      try {
        const res = await fetch(
          `${API_URL}/api/mesa/${mesaId}/docente/${docenteId}/confirmar`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ confirmacion }),
            signal: controller.signal,
          }
        );

        // Limpiar el timeout ya que la petición se completó
        clearTimeout(timeoutId);

        // Verificar si la petición fue exitosa
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Error al confirmar la mesa");
        }

        // Actualizar las mesas para reflejar el cambio
        refreshMesas();
      } catch (error: any) {
        if (error?.name === "AbortError") {
          setError(
            "La petición ha tardado demasiado tiempo. Por favor, inténtelo de nuevo."
          );
        } else {
          setError(error?.message || "Error al confirmar la mesa");
        }
      }
    } catch (error: any) {
      console.error("Error al confirmar la mesa:", error);
      setError("Error al confirmar la mesa. Por favor, inténtelo de nuevo.");
    }
  };

  return (
    <div className="container-fluid px-lg-5">
      <div className="row my-3">
        <div className="col-12">
          <h2 className="mb-3 text-center text-md-start">
            Panel del Docente - {docenteNombre || "Cargando..."}
          </h2>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {loading ? (
            <div className="d-flex justify-content-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : (
            <>
              <ul className="nav nav-tabs mb-3" id="mesasTabs" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link active"
                    id="pendientes-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#mesas-pendientes"
                    type="button"
                    role="tab"
                    aria-controls="mesas-pendientes"
                    aria-selected="true"
                  >
                    Mesas Pendientes ({mesas.length})
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link"
                    id="confirmadas-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#mesas-confirmadas"
                    type="button"
                    role="tab"
                    aria-controls="mesas-confirmadas"
                    aria-selected="false"
                  >
                    Mesas Confirmadas ({mesasConfirmadas.length})
                  </button>
                </li>
              </ul>

              <div className="tab-content" id="mesTabsContent">
                {/* Tab 1: Mesas Pendientes */}
                <div
                  className="tab-pane fade show active"
                  id="mesas-pendientes"
                  role="tabpanel"
                  aria-labelledby="pendientes-tab"
                >
                  <h4 className="h5 mb-3">Mesas Pendientes de Confirmación</h4>
                  {mesas.length === 0 ? (
                    <div className="alert alert-info">
                      No hay mesas pendientes de confirmación.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Materia</th>
                            <th>Fecha</th>
                            <th className="d-none d-md-table-cell">Hora</th>
                            <th className="d-none d-md-table-cell">Aula</th>
                            <th className="d-none d-sm-table-cell">Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mesas.map((mesa) => {
                            const docente = mesa.docentes.find(
                              (d) => d.id === docenteId
                            );
                            if (!docente) return null;
                            const rol =
                              mesa.docentes[0].id === docenteId
                                ? "Titular"
                                : "Vocal";
                            return (
                              <tr key={mesa.id}>
                                <td>
                                  <div>{mesa.materia || "-"}</div>
                                  <div className="d-sm-none">
                                    <small className="text-muted">
                                      Rol: {rol}
                                    </small>
                                  </div>
                                  <div className="d-md-none">
                                    <small className="text-muted">
                                      Hora: {mesa.hora}
                                    </small>
                                  </div>
                                  <div className="d-md-none">
                                    <small className="text-muted">
                                      Aula: {mesa.aula || "-"}
                                    </small>
                                  </div>
                                </td>
                                <td>{mesa.fecha}</td>
                                <td className="d-none d-md-table-cell">
                                  {mesa.hora}
                                </td>
                                <td className="d-none d-md-table-cell">
                                  {mesa.aula || "-"}
                                </td>
                                <td className="d-none d-sm-table-cell">
                                  {rol}
                                </td>
                                <td>
                                  {docente.confirmacion === "aceptado" && (
                                    <span className="badge bg-success">
                                      Aceptado
                                    </span>
                                  )}
                                  {docente.confirmacion === "rechazado" && (
                                    <span className="badge bg-danger">
                                      Rechazado
                                    </span>
                                  )}
                                  {docente.confirmacion === "pendiente" && (
                                    <span className="badge bg-warning">
                                      Pendiente
                                    </span>
                                  )}
                                </td>
                                <td>
                                  {/* Mostrar botones de aceptar/rechazar cuando la mesa está pendiente */}
                                  {mesa.estado !== "confirmada" ? (
                                    <div className="d-flex flex-column flex-sm-row gap-2">
                                      <button
                                        className="btn btn-success btn-sm"
                                        onClick={() =>
                                          handleConfirm(mesa.id, "aceptado")
                                        }
                                        disabled={
                                          docente.confirmacion === "aceptado"
                                        }
                                      >
                                        {docente.confirmacion === "aceptado"
                                          ? "Aceptado"
                                          : "Aceptar"}
                                      </button>
                                      <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() =>
                                          handleConfirm(mesa.id, "rechazado")
                                        }
                                        disabled={
                                          docente.confirmacion === "rechazado"
                                        }
                                      >
                                        {docente.confirmacion === "rechazado"
                                          ? "Rechazado"
                                          : "Rechazar"}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="badge bg-success">
                                      Mesa confirmada
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Tab 2: Mesas Confirmadas */}
                <div
                  className="tab-pane fade"
                  id="mesas-confirmadas"
                  role="tabpanel"
                  aria-labelledby="confirmadas-tab"
                >
                  <h4 className="h5 mb-3">
                    Mesas Confirmadas por el Departamento
                  </h4>
                  {mesasConfirmadas.length === 0 ? (
                    <div className="alert alert-info">
                      No hay mesas confirmadas por el departamento.
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-bordered table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>Materia</th>
                            <th>Fecha</th>
                            <th className="d-none d-md-table-cell">Hora</th>
                            <th className="d-none d-md-table-cell">Aula</th>
                            <th className="d-none d-sm-table-cell">Rol</th>
                            <th>Estado</th>
                            <th className="d-none d-sm-table-cell">Info</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mesasConfirmadas.map((mesa) => {
                            const docente = mesa.docentes.find(
                              (d) => d.id === docenteId
                            );
                            if (!docente) return null;
                            const rol =
                              mesa.docentes[0].id === docenteId
                                ? "Titular"
                                : "Vocal";
                            return (
                              <tr key={mesa.id} className="table-success">
                                <td>
                                  <div>{mesa.materia || "-"}</div>
                                  <div className="d-sm-none">
                                    <small className="text-muted">
                                      Rol: {rol}
                                    </small>
                                  </div>
                                  <div className="d-md-none">
                                    <small className="text-muted">
                                      Hora: {mesa.hora}
                                    </small>
                                  </div>
                                  <div className="d-md-none">
                                    <small className="text-muted">
                                      Aula: {mesa.aula || "-"}
                                    </small>
                                  </div>
                                  <div className="d-sm-none">
                                    <small className="text-muted">
                                      Confirmada por Departamento
                                    </small>
                                  </div>
                                </td>
                                <td>{mesa.fecha}</td>
                                <td className="d-none d-md-table-cell">
                                  {mesa.hora}
                                </td>
                                <td className="d-none d-md-table-cell">
                                  {mesa.aula || "-"}
                                </td>
                                <td className="d-none d-sm-table-cell">
                                  {rol}
                                </td>
                                <td>
                                  {docente.confirmacion === "aceptado" ? (
                                    <span className="badge bg-success">
                                      Aceptado
                                    </span>
                                  ) : (
                                    <span className="badge bg-danger">
                                      Rechazado
                                    </span>
                                  )}
                                </td>
                                <td className="d-none d-sm-table-cell">
                                  <span className="badge bg-success">
                                    Mesa confirmada por el departamento
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocenteDashboard;
