import { Mesa } from "../types";

// Interfaz para el cliente de base de datos
export interface DatabaseClient {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: any) => {
        single: () => Promise<{ data: any | null; error: any }>;
      } & Promise<{ data: any[] | null; error: any }>;
    } & Promise<{ data: any[] | null; error: any }>;
    insert: (data: any) => {
      select: (columns?: string) => Promise<{ data: any[] | null; error: any }>;
    };
    update: (data: any) => {
      eq: (column: string, value: any) => Promise<{ data: any[] | null; error: any }>;
    };
    delete: () => {
      eq: (column: string, value: any) => Promise<{ data: any[] | null; error: any }>;
    };
  };
}

// Patrón Singleton: Garantiza una única instancia de MesaRepository
// Patrón Repository: Encapsula el acceso a los datos de mesas
export class MesaRepository {
  private static instance: MesaRepository;
  private db: DatabaseClient;

  /* istanbul ignore next */
  private constructor(db?: DatabaseClient) {
    if (db) {
      this.db = db;
    } else {
      // Solo importar y usar Supabase en producción
      const { supabase } = require("../config/supabase");
      this.db = supabase;
    }
  }

  public static getInstance(db?: DatabaseClient): MesaRepository {
    if (!MesaRepository.instance) {
      MesaRepository.instance = new MesaRepository(db);
    } else if (db) {
      // Permitir actualizar el cliente de base de datos para pruebas
      MesaRepository.instance.db = db;
    }
    return MesaRepository.instance;
  }

  public async getAllMesas(): Promise<Mesa[]> {
    const result = await this.db.from("mesas").select("*");
    if (result.error) throw new Error(result.error.message);
    return (result.data || []).map(this.adaptMesaFromDB);
  }

  public async getMesasByDocenteId(docenteId: string): Promise<Mesa[]> {
    const result = await this.db.from("mesas").select("*");
    if (result.error) throw new Error(result.error.message);

    const mesasDelDocente = (result.data || []).filter((mesa: any) => {
      const esTitularOVocal =
        mesa.docente_titular === docenteId || mesa.docente_vocal === docenteId;

      const estaEnArrayDocentes =
        Array.isArray(mesa.docentes) &&
        mesa.docentes.some((d: any) => d.id === docenteId);

      return esTitularOVocal || estaEnArrayDocentes;
    });

    console.log(
      `Encontradas ${mesasDelDocente.length} mesas para el docente ${docenteId}`
    );
    return mesasDelDocente.map(this.adaptMesaFromDB);
  }

  public async createMesa(mesa: Mesa): Promise<Mesa> {
    try {
      console.log(
        "Intentando crear mesa con datos:",
        JSON.stringify(mesa, null, 2)
      );

      // Validar datos de entrada
      if (!mesa.materia) {
        throw new Error("La materia es obligatoria");
      }

      if (!mesa.fecha) {
        throw new Error("La fecha es obligatoria");
      }

      // Validar que la fecha no esté en el pasado y sea al menos 48 horas en el futuro
      console.log("Validando fecha de mesa:", mesa.fecha);

      // Convertir la cadena de fecha a objeto Date - asegurar formato correcto
      const fechaParts = mesa.fecha.split("T")[0].split("-");
      const anio = parseInt(fechaParts[0]);
      const mes = parseInt(fechaParts[1]) - 1; // Los meses en JavaScript son de 0-11
      const dia = parseInt(fechaParts[2]);

      const fechaMesa = new Date(anio, mes, dia);
      fechaMesa.setHours(23, 59, 59, 999); // Ajustar al final del día para la comparación correcta

      const ahora = new Date();

      console.log(`DEBUG - Fecha mesa parseada: ${fechaMesa.toISOString()}`);
      console.log(`DEBUG - Fecha actual: ${ahora.toISOString()}`);
      console.log(`DEBUG - ¿Fecha en el pasado? ${fechaMesa < ahora}`);

      // Verificar si la fecha está en el pasado (comparación de días, no de horas)
      const fechaMesaDia = new Date(fechaMesa);
      fechaMesaDia.setHours(0, 0, 0, 0);

      const ahoraDia = new Date(ahora);
      ahoraDia.setHours(0, 0, 0, 0);

      if (fechaMesaDia < ahoraDia) {
        console.error("Fecha invalida: está en el pasado");
        throw new Error("No se puede crear una mesa con fecha en el pasado");
      }

      // Calcular la diferencia en milisegundos y convertir a horas
      const diffMs = fechaMesa.getTime() - ahora.getTime();
      const diffHoras = diffMs / (1000 * 60 * 60);

      console.log(`DEBUG - Diferencia en horas: ${diffHoras}`);

      if (diffHoras < 48) {
        console.error(
          `Fecha invalida: diferencia de solo ${diffHoras} horas, se requieren 48 horas`
        );
        throw new Error(
          `La fecha de la mesa debe ser al menos 48 horas (2 días) en el futuro. Horas actuales: ${diffHoras.toFixed(
            1
          )}`
        );
      }

      if (
        !mesa.docentes ||
        !Array.isArray(mesa.docentes) ||
        mesa.docentes.length < 2
      ) {
        throw new Error("Se requieren al menos dos docentes para una mesa");
      }

      // Verificar conflictos de horario para los docentes
      for (const docente of mesa.docentes) {
        const docenteId = docente.id;

        // Buscar otras mesas donde este docente está asignado
        const existingMesasResult = await this.db.from("mesas").select("*");

        if (existingMesasResult.error) {
          console.error(
            "Error al verificar mesas existentes:",
            existingMesasResult.error
          );
          throw new Error(
            `Error al verificar disponibilidad: ${existingMesasResult.error.message}`
          );
        }

        const existingMesas = existingMesasResult.data;
        if (existingMesas && existingMesas.length > 0) {
          // Verificar conflictos de horario
          for (const existingMesa of existingMesas) {
            // Solo validar si es el mismo día
            if (existingMesa.fecha === mesa.fecha) {
              const horaExistente = parseInt(existingMesa.hora.split(":")[0]);
              const horaNueva = parseInt(mesa.hora.split(":")[0]);

              // Calcular diferencia en horas (valor absoluto)
              const diferencia = Math.abs(horaNueva - horaExistente);

              // Si la diferencia es menor a 4 horas, hay conflicto
              if (diferencia < 4) {
                throw new Error(
                  `Conflicto de horario para el docente ${docente.nombre}: Ya está asignado a una mesa a las ${existingMesa.hora} del mismo día. Debe haber al menos 4 horas de diferencia.`
                );
              }
            }
          }
        }
      }

      // Adaptar mesa para la BD
      const mesaDB = this.adaptMesaToDB(mesa);
      console.log("Mesa adaptada para BD:", mesaDB);

      // Insertar en la BD
      const result = await this.db.from("mesas").insert([mesaDB]).select();

      if (result.error) {
        console.error("Error al insertar mesa en BD:", result.error);
        throw new Error(`Error al crear mesa: ${result.error.message}`);
      }

      if (!result.data || result.data.length === 0) {
        console.error("No se recibieron datos al crear la mesa");
        throw new Error("No se pudo crear la mesa: no se recibieron datos");
      }

      if (!result.data || result.data.length === 0) {
        throw new Error(
          "No se pudo crear la mesa: no se recibieron datos de respuesta"
        );
      }
      console.log("Mesa creada exitosamente:", result.data[0]);
      // Return the mesa from the database rather than the input to ensure we have the correct data
      return this.adaptMesaFromDB(result.data[0]);
    } catch (error) {
      console.error("Error en createMesa:", error);
      throw error; // Re-lanzar para que se maneje en el controlador
    }
  }

  public async updateMesa(
    mesaId: string,
    mesaActualizada: Partial<Mesa>
  ): Promise<Mesa> {

    // Actualiza solo la mesa con el id indicado
    const { error } = await this.db.from("mesas").update(this.adaptMesaToDB(mesaActualizada)).eq("id", mesaId);
    if (error) {
      throw new Error(error.message || "Error al actualizar la mesa");
    }
    // Obtiene la mesa actualizada
    const mesa = await this.getMesaById(mesaId);
    if (!mesa) {
      throw new Error("No se encontró la mesa actualizada");
    }
    return mesa;
=
  }

  public async deleteMesa(mesaId: string): Promise<void> {
    const result = await this.db.from("mesas").delete().eq("id", mesaId);

    if (result.error) throw new Error(result.error.message);
  }

  public async updateConfirmacion(
    mesaId: string,
    docenteId: string,
    confirmacion: import("../types").EstadoConfirmacion
  ): Promise<Mesa> {
    try {

      // Primero obtenemos la mesa actual
      const mesa = await this.getMesaById(mesaId);
      if (!mesa) {
        throw new Error("Mesa no encontrada");
      }

      // Verificamos que el docente exista en la mesa
      const docenteExiste = mesa.docentes.some(d => d.id === docenteId);
      if (!docenteExiste) {
        throw new Error("El docente no está asignado a esta mesa");
      }

      // Actualizamos la confirmación del docente en el array de docentes
      const docentesActualizados = mesa.docentes.map((docente) =>
        docente.id === docenteId ? { ...docente, confirmacion } : docente
      );

      // Actualizamos en la base de datos
      const { error } = await this.db
        .from("mesas")
        .update({ docentes: docentesActualizados })
        .eq("id", mesaId);

      if (error) {
        console.error("Error al actualizar la confirmación:", error);
        throw new Error("Error al actualizar la confirmación en la base de datos");
      }

      // Obtener la mesa actualizada
      const mesaActualizada = await this.getMesaById(mesaId);
      if (!mesaActualizada) {
        throw new Error("No se pudo obtener la mesa actualizada");
      }

      return mesaActualizada;
    } catch (error) {
      console.error("Error en updateConfirmacion:", error);

      throw error;
    }
  }

  async confirmarMesa(mesaId: string): Promise<Mesa> {
    console.log(`Confirmando mesa con ID ${mesaId}`);
    
    // CORREGIDO: Agregar .eq("id", mesaId) para actualizar SOLO la mesa específica
    const updateResult = await this.db
      .from("mesas")
      .update({ estado: "confirmada" })
      .eq("id", mesaId);
    
    if (updateResult.error) {
      console.error(`Error al confirmar mesa ${mesaId}:`, updateResult.error);
      throw new Error(`Error al confirmar mesa: ${updateResult.error.message}`);
    }

    // CORREGIDO: Obtener sólo la mesa específica actualizada
    const result = await this.db
      .from("mesas")
      .select("*")
      .eq("id", mesaId);
    
    if (!result.data || result.data.length === 0) {
      console.error(`No se encontró la mesa ${mesaId} después de confirmarla`);
      throw new Error(`No se encontró la mesa confirmada con ID ${mesaId}`);
    }
    
    const mesa = result.data[0];
    console.log(`Mesa ${mesaId} confirmada correctamente:`, mesa);
    return this.adaptMesaFromDB(mesa);
  }

  public async getMesaById(mesaId: string): Promise<Mesa | null> {
    const result = await this.db.from("mesas").select("*");
    const mesa = result.data?.find((m) => m.id === mesaId);
    if (!mesa) return null;
    return this.adaptMesaFromDB(mesa);
  }

  private adaptarMesaParaFrontend(data: any): Mesa {
    return {
      id: data.id,
      materia: data.materia,
      fecha: data.fecha,
      hora: data.hora,
      aula: data.aula,
      estado: data.estado,
      docente_titular: data.docente_titular,
      docente_vocal: data.docente_vocal,
      docentes: data.docentes || [],
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  // Adaptadores para convertir entre el modelo de la DB y el de la app
  private adaptMesaFromDB(dbMesa: any): Mesa {
    return {
      id: dbMesa.id,
      materia: dbMesa.materia || dbMesa.materia_name || "",
      fecha: dbMesa.fecha,
      hora: dbMesa.hora,
      aula: dbMesa.aula || dbMesa.ubicacion || "",
      estado: dbMesa.estado || "pendiente",
      docente_titular: dbMesa.docente_titular,
      docente_vocal: dbMesa.docente_vocal,
      docentes: dbMesa.docentes || [],
      created_at: dbMesa.created_at,
      updated_at: dbMesa.updated_at,
    };
  }

  private adaptMesaToDB(mesa: any): any {
    // Remover campos que no existen en la BD para evitar errores
    const resultado = {
      id: mesa.id,
      fecha: mesa.fecha,
      hora: mesa.hora,
      aula: mesa.aula || mesa.ubicacion,
      materia: mesa.materia,
      docente_titular: mesa.docentes?.[0]?.id || null,
      docente_vocal: mesa.docentes?.[1]?.id || null,
      docentes: mesa.docentes,
      estado: mesa.estado, // Incluir el estado para que se guarde en la BD
    };

    console.log("Adaptando mesa para BD:", {
      ...resultado,
      docentes: resultado.docentes ? "[Array de docentes]" : undefined,
    });

    return resultado;
  }
}
