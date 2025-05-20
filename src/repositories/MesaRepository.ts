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
    const { data, error } = await supabase
      .from("mesas")
      .select("*")
      .or(`docente_titular.eq.${docenteId},docente_vocal.eq.${docenteId}`);
    if (error) throw new Error(error.message);
    return (data || []).map(this.adaptMesaFromDB);
  }

  public async createMesa(mesa: Mesa): Promise<Mesa> {
    const { error } = await supabase
      .from("mesas")
      .insert([this.adaptMesaToDB(mesa)]);
    if (error) throw new Error(error.message);
    return mesa;
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
    confirmacion: "aceptado" | "rechazado"
  ): Promise<Mesa> {
    // Obtener la mesa
    const { data, error } = await supabase
      .from("mesas")
      .select("*")
      .eq("id", mesaId)
      .single();
    if (error || !data) throw new Error("Mesa no encontrada");
    // Actualizar el estado de confirmación
    let docentes = data.docentes || [];
    docentes = docentes.map((d: any) =>
      d.id === docenteId ? { ...d, confirmacion } : d
    );
    // Guardar
    const { error: updateError } = await supabase
      .from("mesas")
      .update({ docentes })
      .eq("id", mesaId);
    if (updateError) throw new Error(updateError.message);
    return this.adaptMesaFromDB({ ...data, docentes });
  }

  // Adaptadores para convertir entre el modelo de la DB y el de la app
  private adaptMesaFromDB(dbMesa: any): Mesa {
    return {
      id: dbMesa.id,
      materia: dbMesa.materia,
      fecha: dbMesa.fecha,
      hora: dbMesa.hora,
      aula: dbMesa.aula,
      docentes: dbMesa.docentes || [],
    };
  }

  private adaptMesaToDB(mesa: any): any {
    return {
      id: mesa.id,
      fecha: mesa.fecha,
      hora: mesa.hora,
      aula: mesa.aula || mesa.ubicacion,
      materia: mesa.materia,
      docente_titular: mesa.docentes?.[0]?.id || null,
      docente_vocal: mesa.docentes?.[1]?.id || null,
      docentes: mesa.docentes,
    };
  }
}
