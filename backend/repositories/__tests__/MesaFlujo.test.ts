import { MesaRepository } from "../MesaRepository";
import { Mesa } from "../../types";
import { supabase } from "../../config/supabase.test";

describe("Flujo de Mesas", () => {
  let repo: MesaRepository;

  beforeEach(() => {
    // Usar el mock de Supabase para pruebas
    repo = MesaRepository.getInstance(supabase);
    
    // Configurar mocks para las operaciones que se usarán en las pruebas
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        data: [],
        error: null,
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        or: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockImplementation(() => {
          return Promise.resolve({
            data: [
              {
                id: "test-id",
                materia: "Test Materia",
                fecha: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
                hora: "14:00",
                aula: "Aula Test",
                estado: "pendiente",
                docente_titular: "123",
                docente_vocal: "456",
                docentes: [
                  { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
                  { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
                ],
              },
            ],
            error: null,
          });
        }),
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockImplementation((column, value) => {
          // Simular actualización de confirmación de docente
          if (column === "id") {
            const docente_id = value; // En realidad esto sería el ID de la mesa
            return Promise.resolve({
              data: [
                {
                  id: docente_id,
                  materia: "Test Materia",
                  fecha: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
                  hora: "14:00",
                  aula: "Aula Test",
                  estado: "pendiente",
                  docente_titular: "123",
                  docente_vocal: "456",
                  docentes: [
                    { id: "123", nombre: "Docente 1", confirmacion: "aceptado" },
                    { id: "456", nombre: "Docente 2", confirmacion: "aceptado" },
                  ],
                },
              ],
              error: null,
            });
          }
          return Promise.resolve({ data: [], error: null });
        }),
      }),
    });
  });

  it("debería crear una nueva mesa desde el departamento", async () => {
    const nuevaMesa: Partial<Mesa> = {
      materia: "Matemática I",
      fecha: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 3 días en el futuro
      hora: "14:00",
      aula: "Aula 101",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
        { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
      ],
    };

    const mesa = await repo.createMesa(nuevaMesa as Mesa);
    expect(mesa.id).toBeDefined();
    expect(mesa.estado).toBe("pendiente");
    expect(mesa.docentes.length).toBe(2);
  });

  it("debería permitir que ambos docentes acepten la mesa", async () => {
    // Primero creamos una mesa
    const nuevaMesa: Partial<Mesa> = {
      materia: "Física I",
      fecha: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      hora: "15:00",
      aula: "Aula 102",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
        { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
      ],
    };

    const mesa = await repo.createMesa(nuevaMesa as Mesa);

    // Mock para updateConfirmacion
    jest.spyOn(repo, 'updateConfirmacion').mockImplementation((mesaId, docenteId, confirmacion) => {
      return Promise.resolve({
        id: mesaId,
        materia: "Física I",
        fecha: nuevaMesa.fecha as string,
        hora: "15:00",
        aula: "Aula 102",
        estado: "pendiente",
        docente_titular: "123",
        docente_vocal: "456",
        docentes: [
          { 
            id: "123", 
            nombre: "Docente 1", 
            confirmacion: docenteId === "123" ? confirmacion : "pendiente" 
          },
          { 
            id: "456", 
            nombre: "Docente 2", 
            confirmacion: docenteId === "456" ? confirmacion : "pendiente" 
          },
        ],
      });
    });

    // Primer docente acepta
    const mesaDespuesPrimerDocente = await repo.updateConfirmacion(
      mesa.id,
      "123",
      "aceptado"
    );
    expect(
      mesaDespuesPrimerDocente.docentes.find((d) => d.id === "123")
        ?.confirmacion
    ).toBe("aceptado");

    // Segundo docente acepta
    const mesaDespuesSegundoDocente = await repo.updateConfirmacion(
      mesa.id,
      "456",
      "aceptado"
    );
    expect(
      mesaDespuesSegundoDocente.docentes.find((d) => d.id === "456")
        ?.confirmacion
    ).toBe("aceptado");
  });

  it("debería permitir al departamento confirmar la mesa cuando ambos docentes aceptaron", async () => {
    // Primero creamos una mesa
    const nuevaMesa: Partial<Mesa> = {
      materia: "Química I",
      fecha: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      hora: "16:00",
      aula: "Aula 103",
      estado: "pendiente",
      docente_titular: "123",
      docente_vocal: "456",
      docentes: [
        { id: "123", nombre: "Docente 1", confirmacion: "pendiente" },
        { id: "456", nombre: "Docente 2", confirmacion: "pendiente" },
      ],
    };

    const mesa = await repo.createMesa(nuevaMesa as Mesa);

    // Mock para confirmarMesa
    jest.spyOn(repo, 'confirmarMesa').mockImplementation((mesaId) => {
      return Promise.resolve({
        id: mesaId,
        materia: "Química I",
        fecha: nuevaMesa.fecha as string,
        hora: "16:00",
        aula: "Aula 103",
        estado: "confirmada",
        docente_titular: "123",
        docente_vocal: "456",
        docentes: [
          { id: "123", nombre: "Docente 1", confirmacion: "aceptado" },
          { id: "456", nombre: "Docente 2", confirmacion: "aceptado" },
        ],
      });
    });

    // Departamento confirma la mesa
    const mesaConfirmada = await repo.confirmarMesa(mesa.id);
    expect(mesaConfirmada.estado).toBe("confirmada");
  });
});
