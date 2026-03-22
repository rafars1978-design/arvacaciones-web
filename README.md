# AR Vacaciones — base visual preservada + arquitectura lista

Esta versión mantiene el look general del proyecto original y solo lo potencia:

- Home pública con el mismo estilo base.
- Propiedades demo cargadas desde backend.
- Buscador de disponibilidad preparado para Smoobu.
- Panel administrador en `#/admin`.
- CRUD de propiedades con persistencia en JSON.
- Integración de contacto vía API y respaldo por WhatsApp.

## Estructura

- `src/` → frontend Vite/React
- `server/` → backend Express

## Ejecutar en local

### 1. Frontend

```bash
cp .env.example .env
npm install
npm run dev
```

En Windows PowerShell usa:

```powershell
copy .env.example .env
npm install
npm run dev
```

### 2. Backend

Abre otra terminal:

```bash
cd server
cp .env.example .env
npm install
npm run dev
```

En Windows PowerShell:

```powershell
cd server
copy .env.example .env
npm install
npm run dev
```

## URLs

- Frontend: `http://localhost:5173`
- Admin: `http://localhost:5173/#/admin`
- API: `http://localhost:4000/api`

## Acceso admin

- Email: `admin@arvacaciones.com`
- Password: `Admin123!`

## Activar Smoobu

Edita `server/.env`:

```env
SMOOBU_API_KEY=tu_api_key
SMOOBU_CUSTOMER_ID=tu_customer_id
SMOOBU_USE_MOCK=false
```

Cuando pongas el `smoobuApartmentId` en cada propiedad desde el admin, el buscador podrá pasar de demo a disponibilidad real.

## Notas

- Los datos demo están en `server/src/data/properties.json`.
- Los leads de contacto se guardan en `server/src/data/inquiries.json`.
- No hay base de datos todavía; se dejó una base clara para dar el siguiente paso sin romper el diseño.
