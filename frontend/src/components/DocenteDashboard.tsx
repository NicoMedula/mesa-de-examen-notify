import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";

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
  const [activeTab, setActiveTab] = useState("pendientes");
  // Eliminamos el sistema de confirmaciones recientes para siempre usar datos de la BD

  const navigate = useNavigate();

  // Asegurarnos de tener una URL de API definida
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://83d1-181-91-222-184.ngrok-free.app";
  console.log("API_URL en DocenteDashboard:", API_URL);

  const refreshMesas = async (idToUse = docenteId) => {
    const docenteIdActual = idToUse || docenteId || 
      sessionStorage.getItem("docenteId") || 
      localStorage.getItem("docenteId");

    console.log("[refreshMesas] docenteIdActual:", docenteIdActual);

    if (!docenteIdActual || docenteIdActual === "ID") {
      console.error("ID de docente no válido para refrescar mesas");
      setError("No hay un ID de docente válido para refrescar mesas");
      return;
    }

    try {
      console.log(`[refreshMesas] Solicitando mesas para docente ${docenteIdActual}...`);
      const timestamp = new Date().getTime();
      const url = `${API_URL}/api/docente/${docenteIdActual}/mesas?t=${timestamp}`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        mode: "cors",
        cache: "no-cache",
      });

      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }

      const mesasData: Mesa[] = await res.json();
      
      // Asegurarse de que tenemos datos válidos
      if (!Array.isArray(mesasData)) {
        throw new Error("Formato de datos inválido recibido del servidor");
      }

      // Filtrar mesas donde el docente actual está involucrado
      const mesasFiltradas = mesasData.filter(mesa => 
        mesa?.docentes?.some(docente => docente.id === docenteIdActual)
      );

      const mesasConfirmadas = mesasFiltradas.filter(
        mesa => mesa.estado === "confirmada"
      );
      
      const mesasPendientes = mesasFiltradas.filter(
        mesa => mesa.estado !== "confirmada"
      );

      console.log("[refreshMesas] Mesas actualizadas:", {
        total: mesasFiltradas.length,
        confirmadas: mesasConfirmadas.length,
        pendientes: mesasPendientes.length
      });

      // Actualizar el estado con los nuevos datos
      setMesas(mesasPendientes);
      setMesasConfirmadas(mesasConfirmadas);
      
    } catch (error: any) {
      console.error("Error en refreshMesas:", error);
      setError(`Error al actualizar las mesas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Obtener el ID del docente desde sessionStorage o localStorage
    const storedDocenteId =
      sessionStorage.getItem("docenteId") || localStorage.getItem("docenteId");
    const storedUserName =
      sessionStorage.getItem("currentUser") || localStorage.getItem("userName");

    console.log(
      "Datos almacenados - ID:",
      storedDocenteId,
      "Nombre:",
      storedUserName
    );

    if (!storedDocenteId || storedDocenteId === "ID") {
      console.error("No se encontró un ID de docente válido");
      setError(
        "No se encontró un ID de docente válido en la sesión. Por favor, cierre sesión e inicie nuevamente."
      );
      setLoading(false);
      return;
    }

    setDocenteId(storedDocenteId);
    if (storedUserName) {
      setDocenteNombre(storedUserName);
    }

    // Obtener información detallada del docente desde la API
    const fetchDocenteInfo = async () => {
      try {
        console.log(
          `Obteniendo información de docente desde ${API_URL}/api/docentes`
        );

        try {
          const response = await fetch(`${API_URL}/api/docentes`);
          console.log(
            "Respuesta API docentes:",
            response.status,
            response.statusText
          );

          if (response.ok) {
            const docentes = await response.json();
            console.log("Docentes recibidos:", docentes?.length || "ninguno");

            const docente = docentes.find((d: any) => d.id === storedDocenteId);
            if (docente) {
              console.log("Docente encontrado:", docente);
              setDocenteNombre(docente.nombre);
              sessionStorage.setItem("currentUser", docente.nombre);
              localStorage.setItem("userName", docente.nombre);
            } else {
              console.log(
                "Docente no encontrado en la lista, usando email como nombre"
              );
              // Si no encontramos el docente, usamos el email como nombre
              if (storedUserName) {
                setDocenteNombre(storedUserName);
              }
            }
          } else {
            console.warn(
              "Error al obtener lista de docentes:",
              response.status
            );
            // Continuar aunque no se puedan cargar los docentes
          }
        } catch (apiError) {
          console.error("Error al obtener docentes:", apiError);
          // Continuar aunque falle la API
        }

        // Siempre intentamos cargar las mesas, incluso si falla la obtención de información del docente
        console.log("Cargando mesas para el docente:", storedDocenteId);
        await refreshMesas(storedDocenteId);
      } catch (error) {
        console.error("Error general en fetchDocenteInfo:", error);
        setError("Error de conexión. Por favor, intente más tarde.");
        setLoading(false);
      }
    };

    fetchDocenteInfo();

    // Mantenemos un intervalo de refresco corto para detectar cambios rápidamente
    const intervalId = setInterval(() => {
      if (storedDocenteId) {
        refreshMesas(storedDocenteId);
      }
    }, 5000); // Cada 5 segundos para estar siempre actualizado

    return () => clearInterval(intervalId);
  }, [API_URL, refreshMesas]);


  const handleConfirm = async (
    mesaId: string,
    confirmacion: "aceptado" | "rechazado" | "pendiente"
  ) => {
    try {
      setError(null);
      // Mostrar estado de loading durante la operación
      setLoading(true);
      
      console.log(
        `[handleConfirm] Docente ${docenteId} - Cambiando estado de mesa ${mesaId} a: ${confirmacion}`
      );

      // Hacer la llamada a la API

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Aumentamos a 15 segundos

      try {
        console.log(`[handleConfirm] Enviando confirmación al backend para mesa ${mesaId}...`);
        
        const res = await fetch(
          `${API_URL}/api/mesa/${mesaId}/docente/${docenteId}/confirmar`,
          {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Cache-Control": "no-cache"
            },
            body: JSON.stringify({ confirmacion }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        // Obtener la respuesta JSON una sola vez para evitar errores de "body already consumed"
        const responseData = await res.json();

        if (!res.ok) {
          throw new Error(responseData.message || "Error al confirmar la mesa");
        }

        // Usar los datos ya extraídos de la respuesta
        console.log(`[handleConfirm] Confirmación exitosa para mesa ${mesaId}:`, responseData);
        
        // Esperar un tiempo antes de refrescar para asegurar que la BD se actualice completamente
        console.log(`[handleConfirm] Esperando 2 segundos antes de refrescar datos...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Hacer dos refrescos para asegurar consistencia: uno inmediato y otro después de un breve delay
        console.log(`[handleConfirm] Primer refresco de datos desde el servidor...`);
        await refreshMesas();
        
        // Segundo refresco después de un pequeño delay adicional para asegurar que los datos estén actualizados
        console.log(`[handleConfirm] Esperando 3 segundos más para refresco final...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log(`[handleConfirm] Refresco final de datos...`);
        await refreshMesas();
        
        console.log(`[handleConfirm] Proceso de confirmación completado para mesa ${mesaId}`);
        
      } catch (error: any) {
        if (error?.name === "AbortError") {
          console.error(`[handleConfirm] Timeout al confirmar mesa ${mesaId}:`, error);
          setError("La petición ha tardado demasiado tiempo. Por favor, inténtelo de nuevo.");
        } else {
          console.error(`[handleConfirm] Error al confirmar mesa ${mesaId}:`, error);
          setError(error?.message || "Error al confirmar la mesa");
        }
        // Refrescar para asegurar que tenemos el estado correcto
        await refreshMesas();
      }
    } catch (error: any) {
      console.error("[handleConfirm] Error general al confirmar la mesa:", error);
      setError("Error al confirmar la mesa. Por favor, inténtelo de nuevo.");

      await refreshMesas();
    } finally {
      // Asegurarse de que el estado de loading se desactive
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/login");
  };

  // Log de depuración para ver el contenido real de mesas y docenteId
  console.log("[render] docenteId:", docenteId);
  console.log("[render] mesas:", mesas);
  console.log("[render] mesasConfirmadas:", mesasConfirmadas);

  return (
    <>
      {/* Panel limpio, solo el contenido real */}
      <div className="container-fluid px-lg-5">
        <div className="row my-3">
          <div className="col-12 d-flex justify-content-between align-items-center">
            <h2 className="mb-3 text-center text-md-start">
              Panel del Docente - {docenteNombre || "Cargando..."}
            </h2>
            <button className="btn btn-outline-danger" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>

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
              <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "pendientes" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("pendientes")}
                    type="button"
                  >
                    Mesas Pendientes ({mesas.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "confirmadas" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("confirmadas")}
                    type="button"
                  >
                    Mesas Confirmadas ({mesasConfirmadas.length})
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "historial" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("historial")}
                    type="button"
                  >
                    Historial de Mesas
                  </button>
                </li>
              </ul>

              <div className="tab-content" id="mesTabsContent">
                {/* Tab 1: Mesas Pendientes */}
                {activeTab === "pendientes" && (
                  <div>
                    <h4 className="h5 mb-3">
                      Mesas Pendientes de Confirmación
                    </h4>
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
                                    {(docente.confirmacion === "pendiente" || !docente.confirmacion) && (
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
                                          className={`btn ${docente.confirmacion === "aceptado" ? "btn-success" : "btn-outline-success"} btn-sm`}
                                          onClick={() =>
                                            handleConfirm(mesa.id, "aceptado")
                                          }
                                          disabled={[
                                            "confirmada",
                                            "cancelada",
                                          ].includes(mesa.estado || "")}
                                        >
                                          Aceptar
                                        </button>
                                        <button
                                          className={`btn ${docente.confirmacion === "rechazado" ? "btn-danger" : "btn-outline-danger"} btn-sm`}
                                          onClick={() =>
                                            handleConfirm(mesa.id, "rechazado")
                                          }
                                          disabled={[
                                            "confirmada",
                                            "cancelada",
                                          ].includes(mesa.estado || "")}
                                        >
                                          Rechazar
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="d-flex flex-column flex-sm-row gap-2">
                                        <span className={`badge ${docente.confirmacion === "aceptado" ? "bg-success" : docente.confirmacion === "rechazado" ? "bg-danger" : "bg-warning"}`}>
                                          {docente.confirmacion === "aceptado" ? "Aceptado" : 
                                           docente.confirmacion === "rechazado" ? "Rechazado" : "Pendiente"}
                                        </span>
                                      </div>
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
                )}

                {/* Tab 2: Mesas Confirmadas */}
                {activeTab === "confirmadas" && (
                  <div>
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
                              let docente = Array.isArray(mesa.docentes)
                                ? mesa.docentes.find((d) => d.id === docenteId)
                                : undefined;
                              let rol = "-";
                              if (Array.isArray(mesa.docentes)) {
                                if (mesa.docentes[0]?.id === docenteId)
                                  rol = "Titular";
                                else if (mesa.docentes[1]?.id === docenteId)
                                  rol = "Vocal";
                              }
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
                                        Hora: {mesa.hora || "-"}
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
                                  <td>{mesa.fecha || "-"}</td>
                                  <td className="d-none d-md-table-cell">
                                    {mesa.hora || "-"}
                                  </td>
                                  <td className="d-none d-md-table-cell">
                                    {mesa.aula || "-"}
                                  </td>
                                  <td className="d-none d-sm-table-cell">
                                    {rol}
                                  </td>
                                  <td>
                                    {docente?.confirmacion === "aceptado" ? (
                                      <span className="badge bg-success">
                                        Aceptado
                                      </span>
                                    ) : docente?.confirmacion ===
                                      "rechazado" ? (
                                      <span className="badge bg-danger">
                                        Rechazado
                                      </span>
                                    ) : (
                                      <span className="badge bg-secondary">
                                        -
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
                )}

                {/* Tab 3: Historial de Mesas */}
                {activeTab === "historial" && (
                  <div className="card mt-4 shadow-sm">
                    <div className="card-body">
                      <h5 className="card-title mb-3">Historial de Mesas</h5>
                      {(() => {
                        const hoy = new Date();
                        const historial = mesasConfirmadas.filter((mesa) => {
                          const fechaMesa = new Date(mesa.fecha);
                          return fechaMesa < hoy;
                        });
                        if (historial.length === 0) {
                          return (
                            <div className="alert alert-info">
                              No hay mesas en el historial.
                            </div>
                          );
                        }
                        return (
                          <table className="table table-striped table-hover">
                            <thead className="table-light">
                              <tr>
                                <th>Materia</th>
                                <th>Fecha</th>
                                <th>Hora</th>
                                <th>Aula</th>
                                <th>Rol</th>
                                <th>Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {historial.map((mesa) => {
                                const docente = mesa.docentes.find(
                                  (d) => d.id === docenteId
                                );
                                const rol =
                                  mesa.docentes[0].id === docenteId
                                    ? "Titular"
                                    : "Vocal";
                                return (
                                  <tr key={mesa.id}>
                                    <td>{mesa.materia}</td>
                                    <td>{mesa.fecha}</td>
                                    <td>{mesa.hora}</td>
                                    <td>{mesa.aula}</td>
                                    <td>{rol}</td>
                                    <td>
                                      {docente?.confirmacion === "aceptado" ? (
                                        <span className="badge bg-success">
                                          Aceptado
                                        </span>
                                      ) : (
                                        <span className="badge bg-danger">
                                          Rechazado
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DocenteDashboard;
