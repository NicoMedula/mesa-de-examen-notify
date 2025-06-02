# Sistema de Notificación de Mesas de Examen

Este proyecto está dividido en dos partes principales: frontend (React) y backend (en la raíz del proyecto).

## Estructura del Proyecto

```
mesa-de-examen-notify/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes React reutilizables
│   │   ├── config/         # Configuraciones (Supabase, etc.)
│   │   ├── pages/          # Páginas principales
│   │   ├── services/       # Servicios y llamadas a API
│   │   ├── types/          # Definiciones de tipos TypeScript
│   │   └── utils/          # Utilidades y helpers
│   ├── package.json
│   └── tsconfig.json
│
├── src/                     # Backend (en la raíz)
├── package.json            # Configuración del backend
├── tsconfig.json          # Configuración TypeScript del backend
└── README.md
```

## Configuración del Entorno

### Frontend

1. Navegar al directorio frontend:
   ```bash
   cd frontend
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Crear archivo .env con las variables de Supabase:
   ```
   REACT_APP_SUPABASE_URL=tu_url_de_supabase
   REACT_APP_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
   ```
4. Iniciar el servidor de desarrollo:
   ```bash
   npm start
   ```

### Backend (en la raíz)

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Crear archivo .env con las variables necesarias
3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## Tecnologías Utilizadas

### Frontend

- React
- TypeScript
- Bootstrap
- React Router
- Supabase Client

### Backend

- Node.js
- Express
- TypeScript
- Supabase
- Jest (para testing)
