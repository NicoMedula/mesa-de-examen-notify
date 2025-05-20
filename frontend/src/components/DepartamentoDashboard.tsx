import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

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
  docentes: { id: string; nombre: string; confirmacion: string }[];
}

const DepartamentoDashboard: React.FC = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editMesa, setEditMesa] = useState<Mesa | null>(null);
  const [form, setForm] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  // Cargar mesas y docentes
  useEffect(() => {
    fetch("http://192.168.0.6:3001/api/mesas")
      .then((res) => res.json())
      .then((data) => {
        console.log("MESAS DESDE BACKEND", data);
        setMesas(data);
      });
    fetch("http://192.168.0.6:3001/api/docentes")
      .then((res) => res.json())
      .then(setDocentes);
  }, []);

  const handleInput = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const generateId = () =>
    Date.now().toString() + Math.random().toString(36).substring(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.materia || !form.docente_titular || !form.docente_vocal) {
      setError(
        "Debes completar materia y seleccionar un docente titular y un docente vocal."
      );
      return;
    }
    if (form.docente_titular === form.docente_vocal) {
      setError("El titular y el vocal deben ser diferentes");
      return;
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
    const mesaData = {
      materia: form.materia,
      fecha: form.fecha,
      hora: form.hora,
      aula: form.aula,
      docentes: docentesArr,
      docente_titular: form.docente_titular,
      docente_vocal: form.docente_vocal,
      id: editMesa ? editMesa.id : generateId(),
    };
    const url = editMesa
      ? `http://192.168.0.6:3001/api/mesas/${editMesa.id}`
      : "http://192.168.0.6:3001/api/mesas";
    const method = editMesa ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mesaData),
    });
    if (!res.ok) {
      setError("Error al guardar la mesa");
      return;
    }
    setShowForm(false);
    setEditMesa(null);
    setForm({});
    fetch("http://192.168.0.6:3001/api/mesas")
      .then((res) => res.json())
      .then(setMesas);
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
    await fetch(`http://192.168.0.6:3001/api/mesas/${id}`, {
      method: "DELETE",
    });
    setMesas(mesas.filter((m) => m.id !== id));
  };

  return (
    <div className="container mt-4">
      <h2>Gestión de Mesas de Examen</h2>
      <button
        className="btn btn-success mb-3"
        onClick={() => {
          setShowForm(true);
          setEditMesa(null);
          setForm({});
        }}
      >
        Nueva Mesa
      </button>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Materia</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Aula</th>
            <th>Docente Titular</th>
            <th>Docente Vocal</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {mesas.map((mesa) => {
            console.log("RENDER MESA", mesa);
            return (
              <tr key={mesa.id}>
                <td>{mesa.materia || "-"}</td>
                <td>{mesa.fecha}</td>
                <td>{mesa.hora}</td>
                <td>{mesa.aula || "-"}</td>
                <td>{mesa.docentes?.[0]?.nombre || "-"}</td>
                <td>{mesa.docentes?.[1]?.nombre || "-"}</td>
                <td>
                  <button
                    className="btn btn-primary btn-sm me-2"
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {showForm && (
        <div className="card mt-4">
          <div className="card-body">
            <h5 className="card-title">
              {editMesa ? "Editar Mesa" : "Nueva Mesa"}
            </h5>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-2">
                <label>Materia/Cátedra</label>
                <input
                  name="materia"
                  className="form-control"
                  value={form.materia || ""}
                  onChange={handleInput}
                  required
                />
              </div>
              <div className="mb-2">
                <label>Fecha</label>
                <input
                  name="fecha"
                  type="date"
                  className="form-control"
                  value={form.fecha || ""}
                  onChange={handleInput}
                  required
                />
              </div>
              <div className="mb-2">
                <label>Hora</label>
                <input
                  name="hora"
                  type="time"
                  className="form-control"
                  value={form.hora || ""}
                  onChange={handleInput}
                  required
                />
              </div>
              <div className="mb-2">
                <label>Aula</label>
                <input
                  name="aula"
                  className="form-control"
                  value={form.aula || ""}
                  onChange={handleInput}
                  required
                />
              </div>
              <div className="mb-2">
                <label>Docente Titular</label>
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
              <div className="mb-2">
                <label>Docente Vocal</label>
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
              <button className="btn btn-primary mt-2" type="submit">
                Guardar
              </button>
              <button
                className="btn btn-secondary mt-2 ms-2"
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditMesa(null);
                  setForm({});
                }}
              >
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartamentoDashboard;
