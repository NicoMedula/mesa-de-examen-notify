import { Mesa } from "../types";
import { supabase } from "../config/supabase";

// Patrón Singleton: Garantiza una única instancia de MesaRepository
// Patrón Repository: Encapsula el acceso a los datos de mesas
export class MesaRepository {
  private static instance: MesaRepository;

  private constructor() {}

  public static getInstance(): MesaRepository {
    if (!MesaRepository.instance) {
      MesaRepository.instance = new MesaRepository();
    }
    return MesaRepository.instance;
  }

  public async getAllMesas(): Promise<Mesa[]> {
    const { data, error } = await supabase.from("mesas").select("*");
    if (error) throw new Error(error.message);
    // Adaptar los datos para que coincidan con la interfaz Mesa
    return (data || []).map(this.adaptMesaFromDB);
  }

  public async getMesasByDocenteId(docenteId: string): Promise<Mesa[]> {
    // Obtener todas las mesas primero
    const { data, error } = await supabase.from("mesas").select("*");
    
    if (error) throw new Error(error.message);
    
    // Filtrar las mesas que contienen al docente, ya sea como titular, vocal o en el array de docentes
    const mesasDelDocente = (data || []).filter(mesa => {
      // Verificar si el docente está en docente_titular o docente_vocal
      const esTitularOVocal = mesa.docente_titular === docenteId || mesa.docente_vocal === docenteId;
      
      // Verificar si el docente está en el array de docentes
      const estaEnArrayDocentes = Array.isArray(mesa.docentes) && 
        mesa.docentes.some((d: any) => d.id === docenteId);
        
      return esTitularOVocal || estaEnArrayDocentes;
    });
    
    console.log(`Encontradas ${mesasDelDocente.length} mesas para el docente ${docenteId}`);
    return mesasDelDocente.map(this.adaptMesaFromDB);
  }

  public async createMesa(mesa: Mesa): Promise<Mesa> {
    try {
      console.log("Intentando crear mesa con datos:", JSON.stringify(mesa, null, 2));
      
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
      const fechaParts = mesa.fecha.split('T')[0].split('-');
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
        console.error(`Fecha invalida: diferencia de solo ${diffHoras} horas, se requieren 48 horas`);
        throw new Error(`La fecha de la mesa debe ser al menos 48 horas (2 días) en el futuro. Horas actuales: ${diffHoras.toFixed(1)}`);
      }

      
      if (!mesa.docentes || !Array.isArray(mesa.docentes) || mesa.docentes.length < 2) {
        throw new Error("Se requieren al menos dos docentes para una mesa");
      }
      
      // Verificar conflictos de horario para los docentes
      for (const docente of mesa.docentes) {
        const docenteId = docente.id;
        
        // Buscar otras mesas donde este docente está asignado
        const { data: existingMesas, error: fetchError } = await supabase
          .from("mesas")
          .select("*")
          .or(`docente_titular.eq.${docenteId},docente_vocal.eq.${docenteId}`);
        
        if (fetchError) {
          console.error("Error al verificar mesas existentes:", fetchError);
          throw new Error(`Error al verificar disponibilidad: ${fetchError.message}`);
        }
        
        if (existingMesas && existingMesas.length > 0) {
          // Verificar conflictos de horario
          for (const existingMesa of existingMesas) {
            // Solo validar si es el mismo día
            if (existingMesa.fecha === mesa.fecha) {
              const horaExistente = parseInt(existingMesa.hora.split(':')[0]);
              const horaNueva = parseInt(mesa.hora.split(':')[0]);
              
              // Calcular diferencia en horas (valor absoluto)
              const diferencia = Math.abs(horaNueva - horaExistente);
              
              // Si la diferencia es menor a 4 horas, hay conflicto
              if (diferencia < 4) {
                throw new Error(`Conflicto de horario para el docente ${docente.nombre}: Ya está asignado a una mesa a las ${existingMesa.hora} del mismo día. Debe haber al menos 4 horas de diferencia.`);
              }
            }
          }
        }
      }
      
      // Adaptar mesa para la BD
      const mesaDB = this.adaptMesaToDB(mesa);
      console.log("Mesa adaptada para BD:", mesaDB);
      
      // Insertar en la BD
      const result = await supabase
        .from("mesas")
        .insert([mesaDB])
        .select();
        
      if (result.error) {
        console.error("Error al insertar mesa en BD:", result.error);
        throw new Error(`Error al crear mesa: ${result.error.message}`);
      }
      
      if (!result.data || result.data.length === 0) {
        console.error("No se recibieron datos al crear la mesa");
        throw new Error("No se pudo crear la mesa: no se recibieron datos");
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
    const { error } = await supabase
      .from("mesas")
      .update(this.adaptMesaToDB(mesaActualizada))
      .eq("id", mesaId);
    if (error) throw new Error(error.message);
    // Devolver la mesa actualizada
    const { data } = await supabase
      .from("mesas")
      .select("*")
      .eq("id", mesaId)
      .single();
    return this.adaptMesaFromDB(data);
  }

  public async deleteMesa(mesaId: string): Promise<void> {
    const { error } = await supabase.from("mesas").delete().eq("id", mesaId);
    if (error) throw new Error(error.message);
  }

  public async updateConfirmacion(
    mesaId: string,
    docenteId: string,
    confirmacion: import("../types").EstadoConfirmacion
  ): Promise<Mesa> {
    try {
      console.log(`Actualizando confirmación de mesa ${mesaId}, docente ${docenteId} a ${confirmacion}`);
      
      // Obtener la mesa
      const { data, error } = await supabase
        .from("mesas")
        .select("*")
        .eq("id", mesaId)
        .single();
        
      if (error) {
        console.error("Error al obtener la mesa:", error.message);
        throw new Error(`Mesa no encontrada: ${error.message}`);
      }
      
      if (!data) {
        console.error("Mesa no encontrada, ID:", mesaId);
        throw new Error(`Mesa con ID ${mesaId} no encontrada`);
      }
      
      console.log("Mesa encontrada:", data);
      
      // Actualizar el estado de confirmación
      let docentes = Array.isArray(data.docentes) ? [...data.docentes] : [];
      console.log("Docentes originales:", docentes);
      
      // Verificar si el docente existe en la lista
      const docenteExiste = docentes.some((d: any) => d.id === docenteId);
      if (!docenteExiste) {
        console.error(`Docente ${docenteId} no encontrado en la mesa ${mesaId}`);
        throw new Error(`Docente no asignado a esta mesa`);
      }
      
      // Actualizar el docente
      docentes = docentes.map((d: any) =>
        d.id === docenteId ? { ...d, confirmacion } : d
      );
      
      console.log("Docentes actualizados:", docentes);
      
      // Guardar
      const updateResult = await supabase
        .from("mesas")
        .update({ docentes })
        .eq("id", mesaId);
        
      if (updateResult.error) {
        console.error("Error al actualizar docentes:", updateResult.error);
        throw new Error(`Error al actualizar: ${updateResult.error.message}`);
      }
      
      // Verificar que la actualización fue exitosa
      const { data: updatedData, error: fetchError } = await supabase
        .from("mesas")
        .select("*")
        .eq("id", mesaId)
        .single();
        
      if (fetchError) {
        console.error("Error al obtener mesa actualizada:", fetchError);
        throw new Error("Error al verificar actualización");
      }
      
      console.log("Mesa actualizada correctamente:", updatedData);
      return this.adaptMesaFromDB(updatedData);
    } catch (error) {
      console.error("Error en updateConfirmacion:", error);
      throw error; // Re-lanzar para que se maneje en el controlador
    }
  }

  // Adaptadores para convertir entre el modelo de la DB y el de la app
  private adaptMesaFromDB(dbMesa: any): Mesa {
    // Log the raw database mesa object to debug
    console.log("Raw DB Mesa:", dbMesa);
    return {
      id: dbMesa.id,
      // Check for materia in different possible forms
      materia: dbMesa.materia || dbMesa.materia_name || "",
      fecha: dbMesa.fecha,
      hora: dbMesa.hora,
      // Check for aula in different possible forms
      aula: dbMesa.aula || dbMesa.ubicacion || "",
      // Default estado to 'pendiente' if not specified
      estado: dbMesa.estado || "pendiente",
      docentes: dbMesa.docentes || [],
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
      estado: mesa.estado // Incluir el estado para que se guarde en la BD
    };
    
    console.log('Adaptando mesa para BD:', {
      ...resultado,
      docentes: resultado.docentes ? "[Array de docentes]" : undefined
    });
    
    return resultado;
  }
}
