import { createClient } from "@supabase/supabase-js";

// Obtener credenciales de Supabase desde variables de entorno
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

console.log("Inicializando cliente Supabase con URL:", supabaseUrl);
console.log("Service Key disponible:", !!supabaseServiceKey);

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "ERROR: Credenciales de Supabase no encontradas en variables de entorno"
  );
}

// Función para crear el cliente de Supabase
export const createSupabaseClient = (url: string, key: string) => {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    global: {
      fetch: (...args) => {
        // @ts-ignore
        console.log(`Fetch a Supabase:`, args[0]?.toString());
        return fetch(...args);
      },
    },
  });
};

// Crear cliente de Supabase con opciones para mejorar el debugging
export const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);

// Verificar conexión inmediatamente
(async () => {
  try {
    const { data: _data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);
    if (error) {
      console.error("Error verificando conexión a Supabase:", error);
    } else {
      console.log(
        "Conexión a Supabase establecida correctamente, tabla profiles accesible"
      );
    }
  } catch (e) {
    console.error("Excepción al verificar conexión a Supabase:", e);
  }
})();
