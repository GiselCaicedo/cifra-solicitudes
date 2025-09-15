# Sistema de Gestión de Solicitudes CIFRA

## Descripción del Proyecto

Este proyecto es una solución full-stack desarrollada para la **Prueba Técnica de Desarrollador Backend de CIFRA IT**. El sistema maneja un flujo completo de gestión de solicitudes (tickets) con tres perfiles de usuario diferenciados:

- **Cliente**: Puede crear y consultar sus propias solicitudes
- **Soporte**: Atiende, actualiza y responde tickets asignados
- **Administrador**: Vista global del sistema, gestión de usuarios y acceso a reportes

La aplicación simula un entorno real de soporte técnico con funcionalidades avanzadas de notificaciones e integración con IA.

---

## Tecnologías Implementadas

### Backend
- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: 
  - **Producción**: PostgreSQL (Neon)
  - **Desarrollo**: MySQL 8.0 (Docker)
- **ORM**: Prisma
- **Autenticación**: JSON Web Tokens (JWT)
- **Validación**: Zod para esquemas de backend

### Frontend
- **Framework**: React 19
- **Estilos**: Tailwind CSS
- **Componentes**: PrimeReact + componentes personalizados

### Integraciones y Herramientas
- **Notificaciones**: Nodemailer con Gmail
- **IA**: API de OpenAI para sugerencias automáticas
- **Calidad de Código**: ESLint, Prettier, Husky
- **Despliegue**: Vercel

---

## Funcionalidades Implementadas

### Requisitos Mínimos (100% Completado)

#### Autenticación y Autorización
- Login y registro con JWT (`/api/auth/login`, `/api/auth/register`)
- Sistema de roles robusto con restricciones por perfil
- Protección de rutas en frontend y backend

#### Endpoints Principales
- `POST /api/solicitudes` - Creación de solicitudes (clientes)
- `GET /api/solicitudes` - Consulta con filtros por rol:
  - **Admin**: Todas las solicitudes
  - **Soporte**: Asignadas + sin asignar
  - **Cliente**: Solo propias
- `PUT /solicitudes/{id}` - Actualización de estado y respuesta
- `GET /reportes/solicitudes` - Métricas y reportes para administración

#### Modelo de Datos
- Esquema completo: Usuario, Rol, Solicitud, HistorialCambio
- Auditoría completa de cambios

### Funcionalidades Extra Implementadas

#### Seguridad Avanzada
- **Rate Limiting**: Prevención de ataques de fuerza bruta
- **Protección SQL Injection**: Mediante Prisma ORM
- **CORS**: Configuración de orígenes autorizados

#### Características Avanzadas
- **Notificaciones Email**: Alertas automáticas por cambios de estado
- **IA Integrada**: Sugerencias de respuesta con OpenAI
- **Validación Robusta**: Sanitización con Zod en todos los endpoints
- **Manejo de Errores**: Respuestas HTTP consistentes
- **Arquitectura Limpia**: Separación clara de responsabilidades

---

## Instalación y Configuración

### Prerrequisitos
- Node.js (v20+)
- Docker y Docker Compose

### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/giselcaicedo/cifra-solicitudes.git
   cd cifra-solicitudes
   ```

2. **Configurar variables de entorno**
   
   Crear archivo `.env` en la raíz:
   ```env
   # Base de datos
   DATABASE_URL="mysql://cifra:cifra@localhost:3306/cifra_solicitudes"
   
   # JWT
   JWT_SECRET="un_secreto_muy_seguro"
   
   # Email (opcional)
   GMAIL_USER="tu_correo@gmail.com"
   GMAIL_APP_PASSWORD="tu_contraseña_de_aplicacion"
   SUPPORT_EMAIL="correo_de_soporte@ejemplo.com"
   
   # OpenAI (opcional)
   OPENAI_API_KEY="sk-..."
   OPENAI_MODEL="gpt-4o-mini"
   ```

3. **Iniciar base de datos con Docker**
   ```bash
   docker-compose up -d
   ```

4. **Instalar dependencias**
   ```bash
   npm install
   ```

5. **Aplicar migraciones y datos de prueba**
   ```bash
   npx prisma migrate dev --name init
   ```

6. **Ejecutar la aplicación**
   ```bash
   npm run dev
   ```
   
   📍 Disponible en: `http://localhost:3000`

---

## Guía de Pruebas

### Usuarios de Prueba
**Contraseña universal**: `changeme`

| Rol | Email | Capacidades |
|-----|-------|-------------|
| **Admin** | `admin@cifra.test` | Gestión completa, reportes, CRUD usuarios |
| **Soporte** | `soporte1@cifra.test`<br>`soporte2@cifra.test` | Gestión de tickets asignados/sin asignar |
| **Cliente** | `giselcaicedosoler@gmail.com` | Crear y consultar solicitudes propias |

### Flujo de Prueba Recomendado

1. **Como Cliente** (`giselcaicedosoler@gmail.com`):
   - Crear nueva solicitud
   - Ver historial de cambios

2. **Como Soporte** (`soporte1@cifra.test`):
   - Tomar ticket sin asignar
   - Añadir respuesta (auto-asignación)
   - Cambiar estado a "en proceso"

3. **Como Admin** (`admin@cifra.test`):
   - Ver todas las solicitudes
   - Reasignar ticket a otro soporte
   - Cerrar solicitud
   - Revisar reportes y métricas

4. **Verificaciones**:
   - Historial de cambios completo
   - Notificaciones por email (si configurado)
   - Sugerencias de IA en respuestas

---

## Despliegue en Producción

### Configuración para Vercel + Neon

1. **Base de datos**: Crear proyecto en [Neon](https://neon.tech) (PostgreSQL)

2. **Vercel**: Importar repositorio desde GitHub

3. **Variables de entorno**: Configurar las mismas variables del `.env` local

4. **Build personalizado**: Sobrescribir comando en Vercel:
   ```bash
   npx prisma migrate deploy && next build
   ```

### URLs de Producción
- **Frontend**: Desplegado automáticamente en Vercel
- **API**: Rutas disponibles bajo `/api/`
- **Base de datos**: Neon PostgreSQL (escalable)

---

## Estructura del Proyecto

```
cifra-solicitudes/
├── src/
│   ├── app/                    # App Router (Next.js 15)
│   │   ├── api/               # Endpoints de API
│   │   ├── auth/              # Páginas de autenticación
│   │   ├── dashboard/         # Dashboards por rol
│   │   └── admin/             # Panel de administración
│   ├── components/            # Componentes React reutilizables
│   ├── lib/                   # Utilidades y configuraciones
│   │   ├── validators.ts      # Esquemas Zod
│   │   ├── rateLimit.ts       # Rate limiting
│   │   └── cors.ts            # Configuración CORS
│   └── contexts/              # Contextos de React
├── prisma/
│   ├── schema.prisma         # Esquema de base de datos
│   └── seed.ts               # Datos de prueba
├── docker-compose.yml        # Configuración MySQL desarrollo
└── README.md                 # Esta documentación
```


---

## Soporte

Para dudas sobre el proyecto:
- **Email**: giselcaicedosoler@gmail.com
- **GitHub**: [cifra-solicitudes](https://github.com/giselcaicedo/cifra-solicitudes)

