import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { registerPush } from "../registerPush";
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
  const [permiso, setPermiso] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [activeTab, setActiveTab] = useState("pendientes");

  const navigate = useNavigate();

  // Asegurarnos de tener una URL de API definida
  const API_URL =
    process.env.REACT_APP_API_URL ||
    "https://83d1-181-91-222-184.ngrok-free.app";
  console.log("API_URL en DocenteDashboard:", API_URL);

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

    const intervalId = setInterval(() => {
      if (storedDocenteId) {
        refreshMesas(storedDocenteId);
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (docenteId) {
      registerPush();
    }
  }, [docenteId]);

  const refreshMesas = async (idToUse = docenteId) => {
    const docenteIdActual =
      idToUse ||
      docenteId ||
      sessionStorage.getItem("docenteId") ||
      localStorage.getItem("docenteId");

    if (!docenteIdActual || docenteIdActual === "ID") {
      console.error("ID de docente no válido para refrescar mesas");
      setError("No hay un ID de docente válido para refrescar mesas");
      return;
    }

    try {
      console.log(`Refrescando mesas para docente ${docenteIdActual}...`);
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
      const responseText = await res.text();
      let mesasData: Mesa[] = [];
      try {
        const parsedData = JSON.parse(responseText);
        if (Array.isArray(parsedData)) {
          mesasData = parsedData as Mesa[];
        } else {
          setMesas([]);
          setMesasConfirmadas([]);
          setLoading(false);
          return;
        }
      } catch {
        setMesas([]);
        setMesasConfirmadas([]);
        setLoading(false);
        return;
      }
      // Filtrado igual que antes: solo por estado y que el docente esté en la mesa
      const mesasConfirmadas = mesasData.filter(
        (mesa) =>
          mesa.estado === "confirmada" &&
          mesa.docentes &&
          Array.isArray(mesa.docentes) &&
          mesa.docentes.some((d) => d.id === docenteIdActual)
      );
      const mesasPendientes = mesasData.filter(
        (mesa) =>
          mesa.estado !== "confirmada" &&
          mesa.docentes &&
          Array.isArray(mesa.docentes) &&
          mesa.docentes.some((d) => d.id === docenteIdActual)
      );
      setMesas(mesasPendientes);
      setMesasConfirmadas(mesasConfirmadas);
      setLoading(false);
    } catch (error: any) {
      setError("Error al cargar las mesas. Por favor, intente más tarde.");
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

  const forzarRegistro = async () => {
    if (typeof Notification === "undefined") {
      alert("Las notificaciones push no están soportadas en este navegador.");
      return;
    }
    try {
      await registerPush();
      setPermiso(Notification.permission);
      alert("Intentando registrar la suscripción push...");
    } catch (error) {
      console.error("Error al registrar push:", error);
      alert(
        "Error al registrar notificaciones push. Por favor, asegúrate de que Safari tenga permisos para notificaciones."
      );
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/login");
  };

  // Log de depuración para ver el contenido real de mesasConfirmadas
  console.log("mesasConfirmadas en render:", mesasConfirmadas);

  // Indicador visual del valor de activeTab
  const debugActiveTab = (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        background: "yellow",
        zIndex: 9999,
        padding: "4px 12px",
        fontWeight: "bold",
      }}
    >
      activeTab: {activeTab}
    </div>
  );

  // Mensaje de prueba global
  const globalTestMsg = (
    <div style={{ color: "red", fontWeight: "bold", fontSize: 24 }}>
      PRUEBA GLOBAL
    </div>
  );

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

          {typeof Notification !== "undefined" && permiso !== "granted" && (
            <div className="alert alert-warning mt-3">
              <p>
                Las notificaciones push no están habilitadas. Para recibir
                notificaciones:
              </p>
              <ol>
                <li>Abre esta página en Safari</li>
                <li>Agrégala a tu pantalla de inicio</li>
                <li>Haz clic en el botón de abajo</li>
              </ol>
              <button className="btn btn-warning" onClick={forzarRegistro}>
                Habilitar notificaciones push
              </button>
            </div>
          )}

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
