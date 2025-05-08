# Patrones de Diseño Aplicados

## 1. Singleton
- **MesaRepository**: Garantiza una única instancia para el acceso a los datos de mesas.
  - Archivo: `src/repositories/MesaRepository.ts` (líneas 6-20)
- **MesaService**: Única instancia para la lógica de negocio.
  - Archivo: `src/services/MesaService.ts` (líneas 8-22)
- **MesaController**: Única instancia para el controlador de rutas.
  - Archivo: `src/controllers/MesaController.ts` (líneas 6-20)
- **WebSocketNotificacionStrategy**: Única instancia para el canal de notificaciones en tiempo real.
  - Archivo: `src/strategies/NotificacionStrategy.ts` (líneas 7-21)

## 2. Factory
- **NotificacionFactory**: Centraliza la creación de objetos de notificación según el tipo.
  - Archivo: `src/factories/NotificacionFactory.ts` (toda la clase)

## 3. Strategy
- **NotificacionStrategy**: Permite cambiar la forma de enviar notificaciones (WebSocket, consola, etc.).
  - Archivo: `src/strategies/NotificacionStrategy.ts` (interfaces y clases)
- **Uso en MesaService**: Se puede inyectar la estrategia deseada.
  - Archivo: `src/services/MesaService.ts` (líneas 13, 18, 25)

## 4. Repository
- **MesaRepository**: Encapsula el acceso y manipulación de los datos de mesas.
  - Archivo: `src/repositories/MesaRepository.ts` (toda la clase)

## 5. Dependency Injection
- **MesaService**: Permite inyectar la estrategia de notificación deseada mediante el método `setNotificacionStrategy`.
  - Archivo: `src/services/MesaService.ts` (líneas 25-27) 