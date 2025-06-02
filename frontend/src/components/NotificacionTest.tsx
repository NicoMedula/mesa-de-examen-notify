import React, { useState, useEffect } from 'react';
import { registerPush } from '../registerPush';

// Estilos inline para evitar dependencias externas
const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px' } as React.CSSProperties,
  card: { border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } as React.CSSProperties,
  cardHeader: { fontWeight: 'bold', fontSize: '18px', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px' } as React.CSSProperties,
  button: { backgroundColor: '#007bff', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' } as React.CSSProperties,
  buttonSuccess: { backgroundColor: '#28a745', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' } as React.CSSProperties,
  buttonInfo: { backgroundColor: '#17a2b8', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px', cursor: 'pointer' } as React.CSSProperties,
  alert: { padding: '15px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px', marginBottom: '20px' } as React.CSSProperties,
  badge: { padding: '5px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' } as React.CSSProperties,
  badgeSuccess: { backgroundColor: '#28a745', color: 'white' } as React.CSSProperties,
  badgeDanger: { backgroundColor: '#dc3545', color: 'white' } as React.CSSProperties,
  badgeWarning: { backgroundColor: '#ffc107', color: 'black' } as React.CSSProperties,
  row: { display: 'flex', flexWrap: 'wrap', margin: '0 -15px' } as React.CSSProperties,
  col: { flex: '1 0 50%', padding: '0 15px', minWidth: '300px' } as React.CSSProperties,
  pre: { backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', overflow: 'auto', fontSize: '14px' } as React.CSSProperties,
  disabled: { opacity: 0.65, cursor: 'not-allowed' } as React.CSSProperties
};

const NotificacionTest: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [diagnostico, setDiagnostico] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [docenteId, setDocenteId] = useState<string>('');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [serviceWorkerStatus, setServiceWorkerStatus] = useState<string>('No registrado');
  const [pushSubscription, setPushSubscription] = useState<any>(null);
  
  // Obtener la URL de la API desde las variables de entorno o usar la del navegador como fallback
  const API_URL = process.env.REACT_APP_API_URL || window.location.origin.replace(/:\d+$/, "");

  useEffect(() => {
    // Cargar estado de notificaciones
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    } else {
      setNotificationPermission('denied');
      setErrorMsg('Este navegador no soporta notificaciones');
    }

    // Verificar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration()
        .then(registration => {
          if (registration) {
            setServiceWorkerStatus('Registrado');
            return registration.pushManager.getSubscription();
          } else {
            setServiceWorkerStatus('No registrado');
            return null;
          }
        })
        .then(subscription => {
          if (subscription) {
            setPushSubscription(subscription);
          }
        })
        .catch(err => {
          setErrorMsg(`Error verificando Service Worker: ${err.message}`);
        });
    } else {
      setServiceWorkerStatus('No soportado');
    }

    // Obtener el docenteId del almacenamiento
    const storedDocenteId = sessionStorage.getItem("docenteId") || localStorage.getItem("docenteId");
    if (storedDocenteId) {
      setDocenteId(storedDocenteId);
    }

    // Realizar diagnóstico backend
    fetchDiagnostico();
  }, []);

  const fetchDiagnostico = async () => {
    try {
      setStatus('loading');
      const response = await fetch(`${API_URL}/api/push/diagnostico`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setDiagnostico(data);
      setStatus('success');
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      setErrorMsg(error instanceof Error ? error.message : 'Error desconocido');
      setStatus('error');
    }
  };

  const handleRegisterPush = async () => {
    try {
      const result = await registerPush();
      if (result && result.success) {
        alert('Notificaciones registradas correctamente');
        window.location.reload();
      } else {
        setErrorMsg((result && result.error) || 'Error desconocido al registrar notificaciones');
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  const handleSendTestNotification = async () => {
    if (!docenteId) {
      setErrorMsg('No hay un ID de docente disponible para enviar la notificación');
      return;
    }

    try {
      // Agregar timestamp para hacer cada notificación única
      const timestamp = new Date().toISOString();
      console.log(`Enviando notificación de prueba a docente ${docenteId} (${timestamp})`);

      const response = await fetch(`${API_URL}/api/push/enviar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          docenteId,
          titulo: `Notificación de prueba (${new Date().toLocaleTimeString()})`,
          mensaje: `Hola, esta es una notificación de prueba. Timestamp: ${timestamp}`
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Respuesta del servidor:', result);
      alert('Notificación de prueba enviada correctamente');
    } catch (error) {
      console.error('Error al enviar notificación:', error);
      setErrorMsg(error instanceof Error ? error.message : 'Error desconocido');
    }
  };

  return (
    <div style={styles.container}>
      <h1>Diagnóstico de Notificaciones Push</h1>
      
      {errorMsg && <div style={styles.alert}>{errorMsg}</div>}
      
      <div style={styles.row}>
        <div style={styles.col}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>Estado del Cliente</div>
            <div>
              <p><strong>ID de Docente:</strong> {docenteId || 'No disponible'}</p>
              <p>
                <strong>Permiso de Notificaciones:</strong>{' '}
                <span style={{
                  ...styles.badge,
                  ...(notificationPermission === 'granted' ? styles.badgeSuccess : 
                     notificationPermission === 'denied' ? styles.badgeDanger : styles.badgeWarning)
                }}>
                  {notificationPermission}
                </span>
              </p>
              <p>
                <strong>Service Worker:</strong>{' '}
                <span style={{
                  ...styles.badge,
                  ...(serviceWorkerStatus === 'Registrado' ? styles.badgeSuccess : styles.badgeDanger)
                }}>
                  {serviceWorkerStatus}
                </span>
              </p>
              <p>
                <strong>Suscripción Push:</strong>{' '}
                <span style={{
                  ...styles.badge,
                  ...(pushSubscription ? styles.badgeSuccess : styles.badgeDanger)
                }}>
                  {pushSubscription ? 'Activa' : 'No activa'}
                </span>
              </p>
              
              <div>
                <button 
                  style={{
                    ...styles.button,
                    ...(notificationPermission === 'denied' ? styles.disabled : {})
                  }} 
                  onClick={handleRegisterPush}
                  disabled={notificationPermission === 'denied'}
                >
                  {notificationPermission === 'granted' && pushSubscription 
                    ? 'Actualizar Registro de Notificaciones' 
                    : 'Registrar Notificaciones'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div style={styles.col}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>Estado del Servidor</div>
            <div>
              {status === 'loading' && <p>Cargando diagnóstico...</p>}
              
              {status === 'error' && (
                <div style={styles.alert}>
                  Error al obtener diagnóstico del servidor
                </div>
              )}
              
              {status === 'success' && diagnostico && (
                <>
                  <p>
                    <strong>Estado:</strong>{' '}
                    <span style={{
                      ...styles.badge,
                      ...(diagnostico.estado === 'ok' ? styles.badgeSuccess : styles.badgeDanger)
                    }}>
                      {diagnostico.estado}
                    </span>
                  </p>
                  
                  <p>
                    <strong>Clave VAPID configurada:</strong>{' '}
                    <span style={{
                      ...styles.badge,
                      ...(diagnostico.vapid.configured ? styles.badgeSuccess : styles.badgeDanger)
                    }}>
                      {diagnostico.vapid.configured ? 'Sí' : 'No'}
                    </span>
                  </p>
                  
                  <p>
                    <strong>Tabla en Base de Datos:</strong>{' '}
                    <span style={{
                      ...styles.badge,
                      ...(diagnostico.database.tableExists ? styles.badgeSuccess : styles.badgeDanger)
                    }}>
                      {diagnostico.database.tableExists ? 'Existe' : 'No existe'}
                    </span>
                  </p>
                  
                  <p>
                    <strong>Suscripciones almacenadas:</strong>{' '}
                    {diagnostico.database.suscripcionesCount}
                  </p>
                  
                  {diagnostico.database.error && (
                    <div style={styles.alert}>
                      {diagnostico.database.error}
                    </div>
                  )}

                  <div style={{ marginTop: '15px' }}>
                    <p><strong>Clave pública VAPID:</strong></p>
                    <pre style={styles.pre}>
                      {diagnostico.vapid.publicKey}
                    </pre>
                  </div>
                </>
              )}
              
              <div style={{ marginTop: '15px' }}>
                <button 
                  style={styles.buttonInfo} 
                  onClick={fetchDiagnostico}
                >
                  Actualizar Diagnóstico
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div style={styles.card}>
        <div style={styles.cardHeader}>Prueba de Notificaciones</div>
        <div>
          <p>Envíe una notificación de prueba para verificar que todo funcione correctamente.</p>
          <p>La notificación se enviará al ID de docente: <strong>{docenteId || 'No disponible'}</strong></p>
          
          <div>
            <button 
              style={{
                ...styles.buttonSuccess,
                ...(!docenteId || !pushSubscription ? styles.disabled : {})
              }} 
              onClick={handleSendTestNotification}
              disabled={!docenteId || !pushSubscription}
            >
              Enviar Notificación de Prueba
            </button>
          </div>
        </div>
      </div>
      
      <div style={styles.card}>
        <div style={styles.cardHeader}>Solución de Problemas</div>
        <div>
          <h5>Si las notificaciones no funcionan:</h5>
          <ol>
            <li>Verifique que el permiso de notificaciones esté concedido</li>
            <li>Compruebe que el Service Worker esté correctamente registrado</li>
            <li>Asegúrese de que la tabla en la base de datos exista</li>
            <li>Confirme que las claves VAPID coincidan entre frontend y backend</li>
            <li>Compruebe que el ID de docente sea válido</li>
            <li>Verifique que no haya errores CORS o de red</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default NotificacionTest;
