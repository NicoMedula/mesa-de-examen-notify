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
  docentes: {
    id: string;
    nombre: string;
    confirmacion: string;
    confirmacionHora?: string;
  }[];
}

const DepartamentoDashboard: React.FC = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesasConfirmadas, setMesasConfirmadas] = useState<Mesa[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editMesa, setEditMesa] = useState<Mesa | null>(null);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState<string | null>(null);
  const [showRecordatorioModal, setShowRecordatorioModal] = useState(false);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [horasAntes, setHorasAntes] = useState<number>(24);
  const [recordatorios, setRecordatorios] = useState<any[]>([]);

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
  const [activeTab, setActiveTab] = useState("pendientes");

  // Función para mostrar errores temporales
  const showTemporaryError = (errorMessage: string) => {
    setError(errorMessage);
    // El useEffect se encargará de limpiar automáticamente el error después de 4 segundos
  };

  const navigate = useNavigate();

  // Cargar mesas y docentes
  useEffect(() => {
    const fetchMesas = async () => {
      try {
        const API_URL = process.env.REACT_APP_API_URL;
        const res = await fetch(`${API_URL}/api/mesas`);
        if (!res.ok) {
          console.error("Error fetching mesas:", res.status);
          return;
        }
        const data = await res.json();
        console.log("MESAS DESDE BACKEND", data);

        // Verificar que data sea un array antes de procesarlo
        if (Array.isArray(data)) {
          // Separar mesas confirmadas y pendientes
          const confirmadas = data.filter(
            (m: Mesa) => m?.estado === "confirmada"
          );
          const pendientes = data.filter(
            (m: Mesa) => m?.estado !== "confirmada"
          );
          setMesasConfirmadas(confirmadas || []);
          setMesas(pendientes || []);
        } else {
          console.error("Data is not an array:", data);
          setMesasConfirmadas([]);
          setMesas([]);
        }
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
  const refreshMesas = async () => {
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/api/mesas`);
      if (!res.ok) {
        console.error("Error al refrescar las mesas:", res.status);
        return;
      }
      const data = await res.json();
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

  const handleConfirmMesa = async (mesaId: string) => {
    try {
      console.log("Confirming mesa with ID:", mesaId);

      const API_URL = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_URL}/api/mesas/${mesaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "confirmada" }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error ${res.status} al confirmar la mesa:`, errorText);
        setError(`Error al confirmar la mesa: ${res.status} ${errorText}`);
        return;
      }

      // Actualizar las listas después de confirmar
      const mesaConfirmada = mesas.find((m) => m.id === mesaId);
      if (mesaConfirmada) {
        const updatedMesa = { ...mesaConfirmada, estado: "confirmada" };
        setMesasConfirmadas([...mesasConfirmadas, updatedMesa]);
        setMesas(mesas.filter((m) => m.id !== mesaId));
      } else {
        console.warn("Mesa not found in pending list:", mesaId);
        // Refrescar las listas completas para asegurar datos actualizados
        await refreshMesas();
      }
    } catch (error: any) {
      console.error("Error al confirmar mesa:", error);
      setError(
        `Error al confirmar la mesa: ${error?.message || String(error)}`
      );
    }
  };

  const handleCancelMesa = async (mesaId: string) => {
    try {
      console.log("Canceling mesa with ID:", mesaId);

      // Primero obtenemos la mesa para resets los estados de confirmación de los docentes a pendiente
      const API_URL = process.env.REACT_APP_API_URL;
      const mesaCancelada = mesasConfirmadas.find((m) => m.id === mesaId);

      if (!mesaCancelada) {
        console.warn(
          "Mesa no encontrada en la lista de mesas confirmadas:",
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

      // Enviamos la actualización con el cambio de estado y los docentes reiniciados
      const res = await fetch(`${API_URL}/api/mesas/${mesaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado: "pendiente",
          docentes: docentesReiniciados,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Error ${res.status} al cancelar la mesa:`, errorText);
        setError(`Error al cancelar la mesa: ${res.status} ${errorText}`);
        return;
      }

      // Actualizar las listas después de cancelar
      const updatedMesa = {
        ...mesaCancelada,
        estado: "pendiente",
        docentes: docentesReiniciados,
      };
      setMesas([...mesas, updatedMesa]);
      setMesasConfirmadas(mesasConfirmadas.filter((m) => m.id !== mesaId));

      // Mostrar mensaje de éxito
      setError(
        "La mesa ha sido cancelada. Los docentes podrán modificar su confirmación nuevamente."
      );
      setTimeout(() => setError(null), 5000); // Limpiar el mensaje después de 5 segundos
    } catch (error: any) {
      console.error("Error al cancelar mesa:", error);
      setError(`Error al cancelar la mesa: ${error?.message || String(error)}`);
    }
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/login");
  };

  const handleShowRecordatorioModal = async (mesa: Mesa) => {
    setSelectedMesa(mesa);
    setHorasAntes(24); // Valor por defecto: 24 horas
    setShowRecordatorioModal(true);

    // Cargar recordatorios existentes para esta mesa
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      // Obtener el token de autenticación del localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No hay sesión activa. Por favor, inicie sesión nuevamente.");
        setRecordatorios([]);
        return;
      }

      const res = await fetch(`${API_URL}/api/mesa/${mesa.id}/recordatorios`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setRecordatorios(data || []);
      } else {
        console.error("Error al cargar recordatorios:", res.status);
        setRecordatorios([]);
      }
    } catch (error) {
      console.error("Error al cargar recordatorios:", error);
      setRecordatorios([]);
    }
  };

  const handleCloseRecordatorioModal = () => {
    setShowRecordatorioModal(false);
    setSelectedMesa(null);
  };

  const handleCreateRecordatorio = async () => {
    if (!selectedMesa) return;

    try {
      const API_URL = process.env.REACT_APP_API_URL;
      // Obtener el token de autenticación del localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No hay sesión activa. Por favor, inicie sesión nuevamente.");
        return;
      }

      const res = await fetch(
        `${API_URL}/api/mesa/${selectedMesa.id}/recordatorio-programado`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ horas_antes: horasAntes }),
        }
      );

      if (res.ok) {
        const nuevoRecordatorio = await res.json();
        setRecordatorios([...recordatorios, nuevoRecordatorio]);
        setError("Recordatorio creado correctamente");
        setTimeout(() => setError(null), 3000);
      } else {
        const errorData = await res.json();
        setError(
          `Error al crear recordatorio: ${
            errorData.error || "Error desconocido"
          }`
        );
      }
    } catch (error: any) {
      setError(
        `Error al crear recordatorio: ${error.message || "Error desconocido"}`
      );
    }
  };

  const handleDeleteRecordatorio = async (recordatorioId: string) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      // Obtener el token de autenticación del localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No hay sesión activa. Por favor, inicie sesión nuevamente.");
        return;
      }

      const res = await fetch(`${API_URL}/api/recordatorio/${recordatorioId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setRecordatorios(recordatorios.filter((r) => r.id !== recordatorioId));
        setError("Recordatorio eliminado correctamente");
        setTimeout(() => setError(null), 3000);
      } else {
        const errorData = await res.json();
        setError(
          `Error al eliminar recordatorio: ${
            errorData.error || "Error desconocido"
          }`
        );
      }
    } catch (error: any) {
      setError(
        `Error al eliminar recordatorio: ${
          error.message || "Error desconocido"
        }`
      );
    }
  };

  // Función para enviar recordatorio manual a los docentes de una mesa confirmada
  const handleSendRecordatorio = async (mesaId: string) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL;
      // Obtener el token de autenticación del localStorage
      const token = localStorage.getItem("token");

      if (!token) {
        setError("No hay sesión activa. Por favor, inicie sesión nuevamente.");
        return;
      }

      const res = await fetch(
        `${API_URL}/api/mesa/${mesaId}/enviar-recordatorio`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        setError(
          "Recordatorio enviado correctamente a los docentes titular y vocal"
        );
        setTimeout(() => setError(null), 3000);
      } else {
        const errorData = await res.json();
        setError(
          `Error al enviar recordatorio: ${
            errorData.error || "Error desconocido"
          }`
        );
      }
    } catch (error: any) {
      setError(
        `Error al enviar recordatorio: ${error.message || "Error desconocido"}`
      );
    }
  };

  return (
    <div className="container-fluid px-lg-5">
      <div className="row align-items-center my-3">
        <div className="col">
          <div className="row my-3">
            <div className="col-12 d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-3 w-100 justify-content-between">
                <h2 className="mb-3 text-center text-md-start m-0">
                  Panel del Departamento - Gestión de Mesas de Examen
                </h2>
                <img
                  src="/image/logoUCP.png"
                  alt="Logo UCP"
                  style={{
                    height: 120,
                    width: "auto",
                    maxWidth: 260,
                    objectFit: "contain",
                  }}
                />
                <button
                  className="btn btn-outline-danger ms-3"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </div>
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
                    <div className="alert alert-info">
                      No hay mesas pendientes.
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
                                              : mesa.docentes[0]
                                                  .confirmacion === "rechazado"
                                              ? "bg-danger"
                                              : "bg-warning"
                                          }`}
                                        >
                                          {mesa.docentes[0].confirmacion}
                                          {mesa.docentes[0].confirmacionHora &&
                                            ["aceptado", "rechazado"].includes(
                                              mesa.docentes[0].confirmacion
                                            ) && (
                                              <span className="ms-2 small text-muted">
                                                {new Date(
                                                  mesa.docentes[0].confirmacionHora
                                                ).toLocaleString("es-AR", {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                  day: "2-digit",
                                                  month: "2-digit",
                                                  year: "2-digit",
                                                })}
                                              </span>
                                            )}
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
                                              : mesa.docentes[1]
                                                  .confirmacion === "rechazado"
                                              ? "bg-danger"
                                              : "bg-warning"
                                          }`}
                                        >
                                          {mesa.docentes[1].confirmacion}
                                          {mesa.docentes[1].confirmacionHora &&
                                            ["aceptado", "rechazado"].includes(
                                              mesa.docentes[1].confirmacion
                                            ) && (
                                              <span className="ms-2 small text-muted">
                                                {new Date(
                                                  mesa.docentes[1].confirmacionHora
                                                ).toLocaleString("es-AR", {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                  day: "2-digit",
                                                  month: "2-digit",
                                                  year: "2-digit",
                                                })}
                                              </span>
                                            )}
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
                                      {mesa.docentes[0].confirmacionHora &&
                                        ["aceptado", "rechazado"].includes(
                                          mesa.docentes[0].confirmacion
                                        ) && (
                                          <span className="ms-2 small text-muted">
                                            {new Date(
                                              mesa.docentes[0].confirmacionHora
                                            ).toLocaleString("es-AR", {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              day: "2-digit",
                                              month: "2-digit",
                                              year: "2-digit",
                                            })}
                                          </span>
                                        )}
                                    </span>
                                  )}
                                </td>
                                <td className="d-none d-lg-table-cell">
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
                                      {mesa.docentes[1].confirmacionHora &&
                                        ["aceptado", "rechazado"].includes(
                                          mesa.docentes[1].confirmacion
                                        ) && (
                                          <span className="ms-2 small text-muted">
                                            {new Date(
                                              mesa.docentes[1].confirmacionHora
                                            ).toLocaleString("es-AR", {
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              day: "2-digit",
                                              month: "2-digit",
                                              year: "2-digit",
                                            })}
                                          </span>
                                        )}
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
                                    {/* Botón de recordatorios eliminado para mesas pendientes */}
                                    {bothAccepted && (
                                      <button
                                        className="btn btn-success btn-sm"
                                        onClick={() =>
                                          handleConfirmMesa(mesa.id)
                                        }
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
                                        {mesa.docentes[0].confirmacionHora &&
                                          ["aceptado", "rechazado"].includes(
                                            mesa.docentes[0].confirmacion
                                          ) && (
                                            <span className="ms-2 small text-muted">
                                              {new Date(
                                                mesa.docentes[0].confirmacionHora
                                              ).toLocaleString("es-AR", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "2-digit",
                                              })}
                                            </span>
                                          )}
                                      </span>
                                    )}
                                  </small>
                                  <small className="d-block text-muted">
                                    <strong>Vocal:</strong>{" "}
                                    {mesa.docentes?.[1]?.nombre || "-"}
                                    {mesa.docentes?.[1]?.confirmacion && (
                                      <span className="ms-2 badge bg-success">
                                        {mesa.docentes[1].confirmacion}
                                        {mesa.docentes[1].confirmacionHora &&
                                          ["aceptado", "rechazado"].includes(
                                            mesa.docentes[1].confirmacion
                                          ) && (
                                            <span className="ms-2 small text-muted">
                                              {new Date(
                                                mesa.docentes[1].confirmacionHora
                                              ).toLocaleString("es-AR", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "2-digit",
                                              })}
                                            </span>
                                          )}
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
                                    {mesa.docentes[0].confirmacionHora &&
                                      ["aceptado", "rechazado"].includes(
                                        mesa.docentes[0].confirmacion
                                      ) && (
                                        <span className="ms-2 small text-muted">
                                          {new Date(
                                            mesa.docentes[0].confirmacionHora
                                          ).toLocaleString("es-AR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "2-digit",
                                          })}
                                        </span>
                                      )}
                                  </span>
                                )}
                              </td>
                              <td className="d-none d-lg-table-cell">
                                {mesa.docentes?.[1]?.nombre || "-"}
                                {mesa.docentes?.[1]?.confirmacion && (
                                  <span className="ms-2 badge bg-success">
                                    {mesa.docentes[1].confirmacion}
                                    {mesa.docentes[1].confirmacionHora &&
                                      ["aceptado", "rechazado"].includes(
                                        mesa.docentes[1].confirmacion
                                      ) && (
                                        <span className="ms-2 small text-muted">
                                          {new Date(
                                            mesa.docentes[1].confirmacionHora
                                          ).toLocaleString("es-AR", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "2-digit",
                                          })}
                                        </span>
                                      )}
                                  </span>
                                )}
                              </td>
                              <td>
                                <div className="d-flex flex-column flex-sm-row gap-2">
                                  <button
                                    className="btn btn-warning btn-sm"
                                    onClick={() => handleCancelMesa(mesa.id)}
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    className="btn btn-info btn-sm"
                                    onClick={() =>
                                      handleShowRecordatorioModal(mesa)
                                    }
                                  >
                                    Recordatorios
                                  </button>
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() =>
                                      handleSendRecordatorio(mesa.id)
                                    }
                                  >
                                    Enviar Recordatorio
                                  </button>
                                </div>
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
      </div>

      {/* Modal de Recordatorios */}
      {showRecordatorioModal && selectedMesa && (
        <div className="modal show d-block" tabIndex={-1} role="dialog">
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Recordatorios para {selectedMesa.materia}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseRecordatorioModal}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="horasAntes" className="form-label">
                    Horas antes del examen
                  </label>
                  <select
                    id="horasAntes"
                    className="form-select"
                    value={horasAntes}
                    onChange={(e) => setHorasAntes(Number(e.target.value))}
                  >
                    <option value="24">24 horas</option>
                    <option value="48">48 horas</option>
                    <option value="72">72 horas</option>
                  </select>
                </div>

                <button
                  className="btn btn-primary mb-3"
                  onClick={handleCreateRecordatorio}
                >
                  Crear Recordatorio
                </button>

                {recordatorios.length > 0 ? (
                  <div>
                    <h6>Recordatorios programados:</h6>
                    <ul className="list-group">
                      {recordatorios.map((recordatorio) => (
                        <li
                          key={recordatorio.id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <span>
                            {recordatorio.horas_antes} horas antes
                            {recordatorio.enviado && (
                              <span className="badge bg-success ms-2">
                                Enviado
                              </span>
                            )}
                          </span>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() =>
                              handleDeleteRecordatorio(recordatorio.id)
                            }
                          >
                            Eliminar
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p>No hay recordatorios programados.</p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCloseRecordatorioModal}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para el modal */}
      {showRecordatorioModal && (
        <div
          className="modal-backdrop fade show"
          onClick={handleCloseRecordatorioModal}
        ></div>
      )}
    </div>
  );
};

export default DepartamentoDashboard;
