import { createClient } from "@supabase/supabase-js";

// Obtener credenciales de Supabase desde variables de entorno
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

// Loguear información para debugging
console.log("Frontend - Inicializando cliente Supabase");
console.log("URL:", supabaseUrl);
console.log("Anon Key disponible:", !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "ERROR: Credenciales de Supabase no encontradas en variables de entorno del frontend"
  );
}

// Asegurarnos de que las credenciales estén establecidas correctamente
// Usar valores fijos sólo para desarrollo si las variables de entorno fallan
const finalSupabaseUrl =
  supabaseUrl || "https://mcichpwyomtdnwudfnvs.supabase.co";
const finalSupabaseAnonKey =
  supabaseAnonKey ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jaWNocHd5b210ZG53dWRmbnZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMzAzNDgsImV4cCI6MjA2MjkwNjM0OH0._tWRZjJcUy0ksh8YTiyY7ndWopOmtcnfc7-KaNJ4Y7Q";

// Crear cliente de Supabase con opciones mejoradas
export const supabase = createClient(finalSupabaseUrl, finalSupabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});

// Verificar conexión inmediatamente
(async () => {
  try {
    console.log("Verificando conexión a Supabase desde frontend...");
    const { data: _data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);
    if (error) {
      console.error(
        "Error verificando conexión a Supabase desde frontend:",
        error
      );
    } else {
      console.log(
        "Conexión a Supabase establecida correctamente desde frontend"
      );
    }
  } catch (e) {
    console.error(
      "Excepción al verificar conexión a Supabase desde frontend:",
      e
    );
  }
})();
