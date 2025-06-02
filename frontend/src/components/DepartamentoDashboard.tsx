import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useNavigate } from "react-router-dom";

interface Docente {
  id: string;
  nombre: string;
  email: string;
}

interface Mesa {
  id: string;
  materia: string;
  fecha: string;
  hora: string;
  aula: string;
  ubicacion: string;
  estado: string;
  docentes: { id: string; nombre: string; confirmacion: string }[];
}

const DepartamentoDashboard: React.FC = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesasConfirmadas, setMesasConfirmadas] = useState<Mesa[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editMesa, setEditMesa] = useState<Mesa | null>(null);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  // Efecto para limpiar el mensaje de error después de un tiempo
  useEffect(() => {
    let errorTimeout: NodeJS.Timeout;

    if (error) {
      // Configurar un temporizador para limpiar el error después de 4 segundos
      errorTimeout = setTimeout(() => {
        setError(null);
      }, 4000); // 4000 ms = 4 segundos
    }

    // Limpiar el temporizador cuando el componente se desmonte o el error cambie
    return () => {
      if (errorTimeout) {
        clearTimeout(errorTimeout);
      }
    };
  }, [error]); // Se vuelve a ejecutar cada vez que cambia el error
  
  // Configurar refresco automático cada 10 segundos
  useEffect(() => {
    // Refresco inicial
    refreshMesas();
    
    // Configurar intervalo de refresco
    const refreshInterval = setInterval(() => {
      refreshMesas();
    }, 10000); // Refrescar cada 10 segundos
    
    // Limpiar intervalo al desmontar
    return () => clearInterval(refreshInterval);
  }, []);
  const [activeTab, setActiveTab] = useState("pendientes");

  // Función para mostrar errores temporales
  const showTemporaryError = (errorMessage: string) => {
    setError(errorMessage);
    // El useEffect se encargará de limpiar automáticamente el error después de 4 segundos
  };

  const navigate = useNavigate();

  // Cargar mesas y docentes
  // Función para refrescar las mesas desde la BD
  const refreshMesas = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/api/mesas`);
      if (!res.ok) {
        console.error("Error al refrescar las mesas:", res.status);
        return;
      }
      const data = await res.json();
      console.log("Mesas actualizadas desde backend:", data);
      
      if (Array.isArray(data)) {
        const confirmadas = data.filter((m) => m?.estado === "confirmada");
        const pendientes = data.filter((m) => m?.estado !== "confirmada");
        setMesasConfirmadas(confirmadas);
        setMesas(pendientes);
      }
    } catch (error) {
      console.error("Error al refrescar las mesas:", error);
    }
  };
  
  useEffect(() => {
    const fetchMesas = async () => {
      try {
        await refreshMesas();
      } catch (error) {
        console.error("Error fetching mesas:", error);
        setMesasConfirmadas([]);
        setMesas([]);
      }
    };

    const fetchDocentes = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await fetch(`${API_URL}/api/docentes`);
        if (!res.ok) {
          console.error("Error fetching docentes:", res.status);
          return;
        }
        const data = await res.json();
        setDocentes(data || []);
      } catch (error) {
        console.error("Error fetching docentes:", error);
        setDocentes([]);
      }
    };

    fetchMesas();
    fetchDocentes();
  }, []);

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateId = () => {
    // Generate a clean ID without special characters that might cause API issues
    return `mesa_${Date.now().toString()}_${Math.floor(Math.random() * 10000)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones básicas del formulario
    if (!form.materia || !form.docente_titular || !form.docente_vocal) {
      showTemporaryError(
        "Debes completar materia y seleccionar un docente titular y un docente vocal."
      );
      return;
    }

    if (form.docente_titular === form.docente_vocal) {
      showTemporaryError("El titular y el vocal deben ser diferentes");
      return;
    }

    // Validación de la fecha - no permite fechas pasadas o con menos de 48 horas
    if (form.fecha) {
      const fechaSeleccionada = new Date(form.fecha);
      fechaSeleccionada.setHours(23, 59, 59, 999);

      const ahora = new Date();

      // Validación: No permitir fechas en el pasado (comparación por días)
      const fechaSeleccionadaDia = new Date(fechaSeleccionada);
      fechaSeleccionadaDia.setHours(0, 0, 0, 0);

      const ahoraDia = new Date(ahora);
      ahoraDia.setHours(0, 0, 0, 0);

      if (fechaSeleccionadaDia < ahoraDia) {
        showTemporaryError("No se puede crear una mesa con fecha en el pasado");
        return;
      }

      // Validación: Comprobar el margen de 48 horas
      const diffMs = fechaSeleccionada.getTime() - ahora.getTime();
      const diffHoras = diffMs / (1000 * 60 * 60);

      if (diffHoras < 48) {
        showTemporaryError(
          `La fecha de la mesa debe ser al menos 48 horas (2 días) en el futuro. Horas actuales: ${diffHoras.toFixed(
            1
          )}`
        );
        return;
      }
    }
    const docentesArr = [
      {
        id: form.docente_titular,
        nombre:
          docentes.find((d) => d.id === form.docente_titular)?.nombre || "",
        confirmacion:
          form.docentes?.find((d: any) => d.id === form.docente_titular)
            ?.confirmacion || "pendiente",
      },
      {
        id: form.docente_vocal,
        nombre: docentes.find((d) => d.id === form.docente_vocal)?.nombre || "",
        confirmacion:
          form.docentes?.find((d: any) => d.id === form.docente_vocal)
            ?.confirmacion || "pendiente",
      },
    ];

    // Crear un ID limpio para evitar problemas con la API
    const newId = editMesa ? editMesa.id : generateId();
    console.log("ID generado para la mesa:", newId);

    const mesaData = {
      materia: form.materia,
      fecha: form.fecha,
      hora: form.hora,
      aula: form.aula,
      estado: "pendiente",
      docentes: docentesArr,
      docente_titular: form.docente_titular,
      docente_vocal: form.docente_vocal,
      id: newId,
    };

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const url = editMesa
        ? `${API_URL}/api/mesas/${editMesa.id}`
        : `${API_URL}/api/mesas`;
      const method = editMesa ? "PUT" : "POST";

      console.log(`${method} request to ${url} with data:`, mesaData);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mesaData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error ${res.status} al guardar la mesa:`, errorText);
        setError(`Error al guardar la mesa: ${res.status} ${errorText}`);
        return;
      }

      setShowForm(false);
      setEditMesa(null);
      setForm({});

      // Refrescar la lista de mesas con manejo de errores
      try {
        const mesasRes = await fetch(`${API_URL}/api/mesas`);
        if (!mesasRes.ok) {
          console.error("Error al refrescar las mesas:", mesasRes.status);
          return;
        }
        const mesasData = await mesasRes.json();

        if (Array.isArray(mesasData)) {
          const confirmadas = mesasData.filter(
            (m) => m?.estado === "confirmada"
          );
          const pendientes = mesasData.filter(
            (m) => m?.estado !== "confirmada"
          );
          setMesasConfirmadas(confirmadas);
          setMesas(pendientes);
        }
      } catch (error) {
        console.error("Error al refrescar las mesas:", error);
      }
    } catch (error: any) {
      console.error("Error al guardar la mesa:", error);
      showTemporaryError(
        `Error al guardar la mesa: ${error?.message || String(error)}`
      );
    }
  };

  const handleEdit = (mesa: Mesa) => {
    console.log("EDITAR MESA", mesa);
    setEditMesa(mesa);
    setForm({
      materia: mesa.materia,
      fecha: mesa.fecha,
      hora: mesa.hora,
      aula: mesa.aula,
      docente_titular: mesa.docentes?.[0]?.id || "",
      docente_vocal: mesa.docentes?.[1]?.id || "",
      docentes: mesa.docentes,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta mesa?")) return;
    await fetch(`${process.env.REACT_APP_API_URL}/api/mesas/${id}`, {
      method: "DELETE",
    });
    setMesas(mesas.filter((m) => m.id !== id));
  };

  // Función para refrescar las listas de mesas
  // La función refreshMesas ya está definida arriba

  const handleConfirmMesa = async (mesaId: string) => {
    try {
      console.log("[handleConfirmMesa] Iniciando confirmación de mesa con ID:", mesaId);
      
      // Primero, obtenemos los datos actuales de la mesa
      const mesaToUpdate = mesas.find((m) => m.id === mesaId);
      if (!mesaToUpdate) {
        console.error("[handleConfirmMesa] No se encontró la mesa a confirmar:", mesaId);
        setError("No se encontró la mesa a confirmar");
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL;
      console.log("[handleConfirmMesa] API_URL:", API_URL);

      // PASO 1: Primero forzamos la confirmación de cada docente individualmente
      console.log("[handleConfirmMesa] PASO 1: Confirmando cada docente individualmente");
      for (const docente of mesaToUpdate.docentes) {
        try {
          console.log(`[handleConfirmMesa] Confirmando docente ${docente.id} en mesa ${mesaId}`);
          const confirmRes = await fetch(
            `${API_URL}/api/mesa/${mesaId}/docente/${docente.id}/confirmar`,
            {
              method: "POST",
              headers: { 
                "Content-Type": "application/json"
                // No enviar cabeceras de caché que causan problemas CORS
              },
              body: JSON.stringify({ confirmacion: "aceptado" }),
            }
          );

          if (!confirmRes.ok) {
            const errorText = await confirmRes.text();
            console.warn(`[handleConfirmMesa] Advertencia al confirmar docente ${docente.id}:`, errorText);
          } else {
            console.log(`[handleConfirmMesa] Docente ${docente.id} confirmado exitosamente`);
          }
        } catch (docError) {
          console.warn(`[handleConfirmMesa] Error al confirmar docente ${docente.id}:`, docError);
          // Continuamos con el siguiente docente aunque falle uno
        }
      }
      
      // Esperamos un momento para que las confirmaciones se procesen
      console.log("[handleConfirmMesa] Esperando 2 segundos para que se procesen las confirmaciones...");
      await new Promise(resolve => setTimeout(resolve, 2000));

      // PASO 2: Ahora actualizamos el estado general de la mesa
      console.log("[handleConfirmMesa] PASO 2: Actualizando estado general de la mesa");
      
      // Forzamos todas las confirmaciones como aceptadas y el estado como confirmada
      const mesaData = {
        ...mesaToUpdate,
        estado: "confirmada",
        docentes: mesaToUpdate.docentes.map(d => ({ ...d, confirmacion: "aceptado" }))
      };

      console.log("[handleConfirmMesa] Datos completos a enviar:", mesaData);

      // Usamos un timestamp para evitar caché
      const timestamp = new Date().getTime();
      const res = await fetch(`${API_URL}/api/mesas/${mesaId}?t=${timestamp}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json"
          // Eliminamos cabeceras de caché que causan problemas con CORS
        },
        body: JSON.stringify(mesaData),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[handleConfirmMesa] Error ${res.status} al confirmar la mesa:`, errorText);
        setError(`Error al confirmar la mesa: ${res.status} ${errorText}`);
        return;
      }
      
      // Obtenemos la respuesta para tener el objeto actualizado correcto
      const updatedMesaResponse = await res.json();
      console.log("[handleConfirmMesa] Mesa confirmada con éxito:", updatedMesaResponse);
      
      // Actualización optimista en la UI usando los datos que retornó el servidor
      setMesasConfirmadas(prev => [...prev, updatedMesaResponse]);
      setMesas(prev => prev.filter((m) => m.id !== mesaId));
      
      // Esperamos un poco más para asegurar que todos los cambios se han aplicado
      console.log("[handleConfirmMesa] Esperando 3 segundos adicionales antes de refrescar...");
      await new Promise(resolve => setTimeout(resolve, 3000));

      // PASO 3: Hacemos un segundo llamado explícito para confirmar la mesa a nivel de repositorio
      console.log("[handleConfirmMesa] PASO 3: Forzando confirmación directa en repositorio");
      try {
        // Agregamos timestamp para evitar la caché y problemas con CORS
        const timestamp = new Date().getTime();
        const confirmRes = await fetch(`${API_URL}/api/mesa/${mesaId}/confirmar?t=${timestamp}`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
            // Eliminamos cabeceras que causan problemas con CORS
          }
        });
        
        if (confirmRes.ok) {
          console.log("[handleConfirmMesa] Confirmación directa exitosa");
        } else {
          console.warn("[handleConfirmMesa] Advertencia en confirmación directa:", await confirmRes.text());
        }
      } catch (confirmError) {
        console.warn("[handleConfirmMesa] Error en confirmación directa:", confirmError);
      }

      // Refrescamos los datos desde el servidor para asegurar sincronización
      console.log("[handleConfirmMesa] Refrescando datos desde el servidor...");
      await refreshMesas();
      
      console.log("[handleConfirmMesa] Proceso de confirmación completado");
    } catch (error: any) {
      console.error("[handleConfirmMesa] Error general al confirmar mesa:", error);
      setError(
        `Error al confirmar la mesa: ${error?.message || String(error)}`
      );
      // En caso de error, refrescamos para asegurar consistencia
      await refreshMesas();
    }
  };

  const handleCancelMesa = async (mesaId: string) => {
    try {
      console.log("[handleCancelMesa] Iniciando cancelación de mesa con ID:", mesaId);

      // Primero obtenemos la mesa para resetear los estados de confirmación de los docentes a pendiente
      const API_URL = process.env.REACT_APP_API_URL;
      const mesaCancelada = mesasConfirmadas.find((m) => m.id === mesaId);

      if (!mesaCancelada) {
        console.warn(
          "[handleCancelMesa] Mesa no encontrada en la lista de mesas confirmadas:",
          mesaId
        );
        setError(`Error al cancelar: Mesa no encontrada`);
        return;
      }

      // Reiniciamos el estado de confirmación de cada docente a pendiente
      const docentesReiniciados = mesaCancelada.docentes.map((docente) => ({
        ...docente,
        confirmacion: "pendiente", // Resetear a pendiente para que el docente pueda confirmar nuevamente
      }));

      console.log("[handleCancelMesa] Datos preparados para enviar:", {
        estado: "pendiente",
        docentes: docentesReiniciados
      });

      // Agregamos timestamp para evitar la caché
      const timestamp = new Date().getTime();
      
      // Enviamos la actualización con el cambio de estado y los docentes reiniciados
      const res = await fetch(`${API_URL}/api/mesas/${mesaId}?t=${timestamp}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "pendiente",
          docentes: docentesReiniciados,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`[handleCancelMesa] Error ${res.status} al cancelar la mesa:`, errorText);
        setError(`Error al cancelar la mesa: ${res.status} ${errorText}`);
        return;
      }

      // Obtener la respuesta para asegurar que tenemos los datos correctos
      const updatedMesaResponse = await res.json();
      console.log("[handleCancelMesa] Respuesta del servidor:", updatedMesaResponse);
      
      // Actualización optimista en la UI usando los datos que retornó el servidor
      setMesas(prev => [...prev, updatedMesaResponse]);
      setMesasConfirmadas(prev => prev.filter((m) => m.id !== mesaId));

      // Esperar unos segundos y refrescar los datos para asegurar sincronización
      console.log("[handleCancelMesa] Esperando 2 segundos antes de refrescar datos...");
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refrescar datos desde el servidor
      console.log("[handleCancelMesa] Refrescando datos desde el servidor...");
      await refreshMesas();

      // Mostrar mensaje de éxito
      setError(
        "La mesa ha sido cancelada. Los docentes podrán modificar su confirmación nuevamente."
      );
      setTimeout(() => setError(null), 5000); // Limpiar el mensaje después de 5 segundos
      
      console.log("[handleCancelMesa] Proceso de cancelación completado");
    } catch (error: any) {
      console.error("[handleCancelMesa] Error general al cancelar mesa:", error);
      setError(`Error al cancelar la mesa: ${error?.message || String(error)}`);
      // En caso de error, refrescamos para asegurar consistencia
      await refreshMesas();
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="container-fluid px-lg-5">
      <div className="row my-3">
        <div className="col-12 d-flex justify-content-between align-items-center">
          <h2 className="mb-3 text-center text-md-start">
            Panel del Departamento - Gestión de Mesas de Examen
          </h2>
          <button className="btn btn-outline-danger" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
        <div className="col-12">
         

          <div className="d-grid d-md-block mb-3">
            <button
              className="btn btn-success mb-2 mb-md-0 me-md-2"
              onClick={() => {
                setShowForm(true);
                setEditMesa(null);
                setForm({});
              }}
            >
              Nueva Mesa
            </button>
          </div>

          {/* Tabs de navegación mejoradas */}
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "pendientes" ? "active" : ""
                }`}
                onClick={() => setActiveTab("pendientes")}
                type="button"
              >
                Mesas Pendientes
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
                Mesas Confirmadas
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "docentes" ? "active" : ""
                }`}
                onClick={() => setActiveTab("docentes")}
                type="button"
              >
                Docentes Registrados
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

          {error && <div className="alert alert-danger">{error}</div>}

          {/* Tab de mesas pendientes */}
          {activeTab === "pendientes" && (
            <>
              {mesas.length === 0 ? (
                <div className="alert alert-info">No hay mesas pendientes.</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Materia</th>
                        <th>Fecha</th>
                        <th className="d-none d-md-table-cell">Hora</th>
                        <th className="d-none d-md-table-cell">Aula</th>
                        <th className="d-none d-lg-table-cell">
                          Docente Titular
                        </th>
                        <th className="d-none d-lg-table-cell">
                          Docente Vocal
                        </th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mesas.map((mesa) => {
                        // Verificar si ambos docentes han aceptado
                        const bothAccepted =
                          mesa.docentes?.[0]?.confirmacion === "aceptado" &&
                          mesa.docentes?.[1]?.confirmacion === "aceptado";

                        return (
                          <tr key={mesa.id}>
                            <td>
                              <div>{mesa.materia || "-"}</div>
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
                              <div className="d-lg-none mt-2">
                                <small className="d-block text-muted">
                                  <strong>Titular:</strong>{" "}
                                  {mesa.docentes?.[0]?.nombre || "-"}
                                  {mesa.docentes?.[0]?.confirmacion && (
                                    <span
                                      className={`ms-2 badge ${
                                        mesa.docentes[0].confirmacion ===
                                        "aceptado"
                                          ? "bg-success"
                                          : mesa.docentes[0].confirmacion ===
                                            "rechazado"
                                          ? "bg-danger"
                                          : "bg-warning"
                                      }`}
                                    >
                                      {mesa.docentes[0].confirmacion}
                                    </span>
                                  )}
                                </small>
                                <small className="d-block text-muted">
                                  <strong>Vocal:</strong>{" "}
                                  {mesa.docentes?.[1]?.nombre || "-"}
                                  {mesa.docentes?.[1]?.confirmacion && (
                                    <span
                                      className={`ms-2 badge ${
                                        mesa.docentes[1].confirmacion ===
                                        "aceptado"
                                          ? "bg-success"
                                          : mesa.docentes[1].confirmacion ===
                                            "rechazado"
                                          ? "bg-danger"
                                          : "bg-warning"
                                      }`}
                                    >
                                      {mesa.docentes[1].confirmacion}
                                    </span>
                                  )}
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
                            <td className="d-none d-lg-table-cell">
                              {mesa.docentes?.[0]?.nombre || "-"}
                              {mesa.docentes?.[0]?.confirmacion && (
                                <span
                                  className={`ms-2 badge ${
                                    mesa.docentes[0].confirmacion === "aceptado"
                                      ? "bg-success"
                                      : mesa.docentes[0].confirmacion ===
                                        "rechazado"
                                      ? "bg-danger"
                                      : "bg-warning"
                                  }`}
                                >
                                  {mesa.docentes[0].confirmacion}
                                </span>
                              )}
                            </td>
                            <td className="d-none d-lg-table-cell">
                              {mesa.docentes?.[1]?.nombre || "-"}
                              {mesa.docentes?.[1]?.confirmacion && (
                                <span
                                  className={`ms-2 badge ${
                                    mesa.docentes[1].confirmacion === "aceptado"
                                      ? "bg-success"
                                      : mesa.docentes[1].confirmacion ===
                                        "rechazado"
                                      ? "bg-danger"
                                      : "bg-warning"
                                  }`}
                                >
                                  {mesa.docentes[1].confirmacion}
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="d-flex flex-column flex-sm-row gap-2">
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => handleEdit(mesa)}
                                >
                                  Editar
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => handleDelete(mesa.id)}
                                >
                                  Eliminar
                                </button>
                                {bothAccepted && (
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleConfirmMesa(mesa.id)}
                                  >
                                    Confirmar
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Tab de mesas confirmadas */}
          {activeTab === "confirmadas" && (
            <>
              {mesasConfirmadas.length === 0 ? (
                <div className="alert alert-info">
                  No hay mesas confirmadas.
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
                        <th className="d-none d-lg-table-cell">
                          Docente Titular
                        </th>
                        <th className="d-none d-lg-table-cell">
                          Docente Vocal
                        </th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mesasConfirmadas.map((mesa) => (
                        <tr key={mesa.id} className="table-success">
                          <td>
                            <div>{mesa.materia || "-"}</div>
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
                            <div className="d-lg-none mt-2">
                              <small className="d-block text-muted">
                                <strong>Titular:</strong>{" "}
                                {mesa.docentes?.[0]?.nombre || "-"}
                                {mesa.docentes?.[0]?.confirmacion && (
                                  <span className="ms-2 badge bg-success">
                                    {mesa.docentes[0].confirmacion}
                                  </span>
                                )}
                              </small>
                              <small className="d-block text-muted">
                                <strong>Vocal:</strong>{" "}
                                {mesa.docentes?.[1]?.nombre || "-"}
                                {mesa.docentes?.[1]?.confirmacion && (
                                  <span className="ms-2 badge bg-success">
                                    {mesa.docentes[1].confirmacion}
                                  </span>
                                )}
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
                          <td className="d-none d-lg-table-cell">
                            {mesa.docentes?.[0]?.nombre || "-"}
                            {mesa.docentes?.[0]?.confirmacion && (
                              <span className="ms-2 badge bg-success">
                                {mesa.docentes[0].confirmacion}
                              </span>
                            )}
                          </td>
                          <td className="d-none d-lg-table-cell">
                            {mesa.docentes?.[1]?.nombre || "-"}
                            {mesa.docentes?.[1]?.confirmacion && (
                              <span className="ms-2 badge bg-success">
                                {mesa.docentes[1].confirmacion}
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleCancelMesa(mesa.id)}
                            >
                              Cancelar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Tab de docentes registrados */}
          {activeTab === "docentes" && (
            <div className="card mt-4 shadow-sm">
              <div className="card-body">
                <h5 className="card-title mb-3">Docentes registrados</h5>
                {docentes.length === 0 ? (
                  <div className="alert alert-info">
                    No hay docentes registrados.
                  </div>
                ) : (
                  <table className="table table-striped table-hover">
                    <thead className="table-light">
                      <tr>
                        <th style={{ width: "60px" }}>#</th>
                        <th>Nombre y Apellido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docentes.map((docente, idx) => (
                        <tr key={docente.id}>
                          <td>{idx + 1}</td>
                          <td>{docente.nombre}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

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
                          <th>Docente Titular</th>
                          <th>Docente Vocal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historial.map((mesa) => (
                          <tr key={mesa.id}>
                            <td>{mesa.materia}</td>
                            <td>{mesa.fecha}</td>
                            <td>{mesa.hora}</td>
                            <td>{mesa.aula}</td>
                            <td>{mesa.docentes?.[0]?.nombre || "-"}</td>
                            <td>{mesa.docentes?.[1]?.nombre || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
          )}

          {showForm && (
            <div className="card mt-4">
              <div className="card-body">
                <h5 className="card-title">
                  {editMesa ? "Editar Mesa" : "Nueva Mesa"}
                </h5>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-12 col-md-6 mb-3">
                      <label className="form-label">Materia/Cátedra</label>
                      <input
                        name="materia"
                        className="form-control"
                        value={form.materia || ""}
                        onChange={handleInput}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6 mb-3">
                      <label className="form-label">Fecha</label>
                      <input
                        name="fecha"
                        type="date"
                        className="form-control"
                        value={form.fecha || ""}
                        onChange={handleInput}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6 mb-3">
                      <label className="form-label">Hora</label>
                      <input
                        name="hora"
                        type="time"
                        className="form-control"
                        value={form.hora || ""}
                        onChange={handleInput}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6 mb-3">
                      <label className="form-label">Aula</label>
                      <input
                        name="aula"
                        className="form-control"
                        value={form.aula || ""}
                        onChange={handleInput}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-6 mb-3">
                      <label className="form-label">Docente Titular</label>
                      <select
                        name="docente_titular"
                        className="form-select"
                        value={form.docente_titular || ""}
                        onChange={handleInput}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {docentes
                          .filter((d) => d.id !== form.docente_vocal)
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.nombre}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-6 mb-3">
                      <label className="form-label">Docente Vocal</label>
                      <select
                        name="docente_vocal"
                        className="form-select"
                        value={form.docente_vocal || ""}
                        onChange={handleInput}
                        required
                      >
                        <option value="">Seleccionar...</option>
                        {docentes
                          .filter((d) => d.id !== form.docente_titular)
                          .map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.nombre}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                  <div className="d-flex flex-column flex-sm-row gap-2 mt-3">
                    <button className="btn btn-primary" type="submit">
                      Guardar
                    </button>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditMesa(null);
                        setForm({});
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DepartamentoDashboard;
