import { v4 as uuidv4 } from "uuid";
import { supabase } from "../../config/supabase";

class RecordatorioRepository {
  private static instance: RecordatorioRepository;

  private constructor() {}

  public static getInstance(): RecordatorioRepository {
    if (!RecordatorioRepository.instance) {
      RecordatorioRepository.instance = new RecordatorioRepository();
    }
    return RecordatorioRepository.instance;
  }

  async getRecordatoriosByMesaId(mesaId: string) {
    const { data, error } = await supabase
      .from("recordatorios_mesa")
      .select("*")
      .eq("mesa_id", mesaId);

    if (error) {
      console.error("Error al obtener recordatorios:", error);
      throw new Error(`Error al obtener recordatorios: ${error.message}`);
    }

    return data || [];
  }

  async createRecordatorio(mesaId: string, horasAntes: number) {
    const id = uuidv4();
    const recordatorio = {
      id,
      mesa_id: mesaId,
      horas_antes: horasAntes,
      enviado: false,
      fecha_creacion: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("recordatorios_mesa")
      .insert([recordatorio])
      .select();

    if (error) {
      console.error("Error al crear recordatorio:", error);
      throw new Error(`Error al crear recordatorio: ${error.message}`);
    }

    return data?.[0] || recordatorio;
  }

  async updateRecordatorio(id: string, updates: any) {
    const { data, error } = await supabase
      .from("recordatorios_mesa")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) {
      console.error("Error al actualizar recordatorio:", error);
      throw new Error(`Error al actualizar recordatorio: ${error.message}`);
    }

    return data?.[0];
  }

  async deleteRecordatorio(id: string) {
    const { error } = await supabase
      .from("recordatorios_mesa")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error al eliminar recordatorio:", error);
      throw new Error(`Error al eliminar recordatorio: ${error.message}`);
    }

    return true;
  }

  async getRecordatoriosPendientes() {
    const { data, error } = await supabase
      .from("recordatorios_mesa")
      .select("*, mesas(*)")
      .eq("enviado", false);

    if (error) {
      console.error("Error al obtener recordatorios pendientes:", error);
      throw new Error(
        `Error al obtener recordatorios pendientes: ${error.message}`
      );
    }

    return data || [];
  }
}

export default RecordatorioRepository;
