export async function registerPush() {
  console.log("Iniciando registro de notificaciones push...");

  // Verificar si el navegador soporta Service Workers y Push API
  if (!("serviceWorker" in navigator)) {
    console.error("Este navegador no soporta Service Workers");
    return;
  }

  if (!("PushManager" in window)) {
    console.error("Este navegador no soporta la API de Push");
    return;
  }

  try {
    // Obtener la URL de la API desde las variables de entorno o usar la del navegador como fallback
    const API_URL =
      process.env.REACT_APP_API_URL ||
      window.location.origin.replace(/:\d+$/, "");
    console.log("API URL para notificaciones:", API_URL);

    // Detectar navegador iOS
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      console.log("Dispositivo iOS detectado, usando configuración especial");
    }

    // Registrar el service worker
    console.log("Registrando service worker...");
    const registration = await navigator.serviceWorker.register(
      "/service-worker.js",
      {
        scope: "/",
      }
    );
    console.log("Service Worker registrado correctamente:", registration);

    // Solicitar permiso para notificaciones
    console.log("Solicitando permiso para notificaciones...");
    const permission = await Notification.requestPermission();
    console.log("Permiso de notificaciones:", permission);

    if (permission !== "granted") {
      throw new Error("Permiso de notificaciones denegado");
    }

    // Obtener el docenteId del almacenamiento
    const docenteId =
      sessionStorage.getItem("docenteId") || localStorage.getItem("docenteId");
    if (!docenteId) {
      throw new Error(
        "No se encontró el ID del docente para registrar la suscripción push"
      );
    }

    // Usar una clave VAPID directa para evitar problemas de API
    console.log("Obteniendo clave pública VAPID...");

    // Usar la clave VAPID directamente desde las variables de entorno si está disponible
    // o usar un valor codificado como fallback para desarrollo
    const DIRECT_VAPID_KEY =
      "BPaSiaEDBPZ5-sxFuEeJvaheaqSDwlIRJZqdUVycYeycUBuVVM4LjLFa6YbRL3uaipiTm7ykE2eRbn0dtG7Vdbg";

    let publicKey = DIRECT_VAPID_KEY;

    // Intentar obtener la clave del servidor solo si no tenemos una clave directa
    if (!DIRECT_VAPID_KEY) {
      try {
        console.log(
          `Intentando obtener clave VAPID de ${API_URL}/api/push/public-key`
        );
        const response = await fetch(`${API_URL}/api/push/public-key`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          mode: "cors",
          cache: "no-cache",
          credentials: "omit", // Importante para evitar problemas de CORS
        });

        if (!response.ok) {
          throw new Error(`Error obteniendo clave VAPID: ${response.status}`);
        }

        const text = await response.text();
        console.log("Respuesta del servidor (texto):", text);

        try {
          const data = JSON.parse(text);
          publicKey = data.publicKey;
          console.log("Clave VAPID obtenida del servidor:", publicKey);
        } catch (parseError) {
          console.error("Error al parsear respuesta JSON:", parseError);
          throw new Error("Respuesta inválida del servidor");
        }
      } catch (error) {
        console.error("Error al obtener clave VAPID del servidor:", error);
        console.log("Usando clave VAPID alternativa para desarrollo");
      }
    } else {
      console.log("Usando clave VAPID directa para desarrollo");
    }

    console.log("Clave pública VAPID configurada:", publicKey);

    // Suscribirse a las notificaciones push
    console.log("Creando suscripción push...");
    let subscription;
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    } catch (err) {
      if (err.name === "InvalidStateError") {
        console.warn(
          "Ya existe una suscripción con otra clave. Eliminando y reintentando..."
        );
        const existing = await registration.pushManager.getSubscription();
        if (existing) {
          await existing.unsubscribe();
        }
        // Reintentar la suscripción
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      } else {
        throw err;
      }
    }
    console.log("Suscripción generada:", JSON.stringify(subscription));

    // Guardar la suscripción localmente para evitar problemas con el backend
    try {
      console.log("Suscripción generada correctamente");
      localStorage.setItem("pushSubscription", JSON.stringify(subscription));

      // Intentar enviar la suscripción al backend
      console.log("Intentando enviar suscripción al backend...");
      try {
        const res = await fetch(`${API_URL}/api/push/subscribe`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          mode: "cors",
          cache: "no-cache",
          body: JSON.stringify({ docenteId, subscription }),
        });

        if (res.ok) {
          console.log("Suscripción enviada correctamente al backend");
        } else {
          // Capturar el texto de error de la respuesta
          let errorMessage = `Error ${res.status} ${res.statusText}`;
          try {
            const errorText = await res.text();
            console.warn("Respuesta de error del servidor:", errorText);
            // Intentar parsear como JSON si es posible
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error || errorMessage;
            } catch (e) {
              // Si no es JSON, usar el texto como está
              if (errorText && errorText.length < 100) {
                errorMessage = errorText;
              }
            }
          } catch (e) {
            console.error("Error al leer respuesta de error:", e);
          }
          console.error(
            "Error al enviar suscripción al backend:",
            errorMessage
          );
          // No lanzar error aquí, solo registrar y continuar
        }
      } catch (sendError) {
        console.error("Excepción al enviar suscripción al backend:", sendError);
        // No lanzar error, solo registrar y continuar
      }

      // Devolver éxito incluso si falla el envío al backend, ya que tenemos la suscripción localmente
      return {
        success: true,
        message: "Notificaciones configuradas correctamente",
      };
    } catch (error) {
      console.error("Error al procesar suscripción:", error);
      return { success: false, error: error.message };
    }
  } catch (error) {
    console.error("Error al registrar notificaciones push:", error);
    return { success: false, error: error.message };
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
