# Manual Técnico de MandamosHuevos

Este documento tiene como objetivo explicar, de forma sencilla y directa, cómo está construida la aplicación web "MandamosHuevos" y cómo funcionan sus diferentes partes. Está pensado para que cualquier persona con conocimientos básicos de programación pueda entender el flujo del sistema.

## 1. Resumen Ficha Técnica

- **Framework Principal:** React (Librería de JavaScript para construir interfaces de usuario).
- **Herramienta de Construcción:** Vite (Empaquetador rápido y moderno para proyectos web).
- **Base de Datos y Backend:** Supabase (Plataforma basada en PostgreSQL que ofrece autenticación de usuarios, base de datos en tiempo real y reglas de seguridad).
- **Lenguaje Principal:** JavaScript (JS) junto con JSX (Sintaxis especial de React que permite escribir HTML dentro de JavaScript).
- **Mapas y Geolocalización:** Leaflet, OpenStreetMap y Photon API.

## 2. Estructura de Carpetas

Todo el código fuente donde interactuamos se encuentra dentro de la carpeta `src/` (source/fuente). Esta es la organización principal:

- `src/components/`: Aquí guardamos los "bloques de construcción" visuales que se reutilizan en distintas partes de la web. (Ejemplos: Menú de navegación, tarjeta de producto, buscador de calles).
- `src/pages/`: Contiene las "pantallas" completas de la aplicación web. Cada archivo corresponde a una página distinta a la que el usuario puede acceder, como "Muro", "Login" o "Carrito de Nueva Compra".
- `src/services/`: Aquí se encuentra toda la "lógica profunda" o "backend virtual". Son archivos de funciones matemáticas, reglas de negocio y conexiones a la base de datos Supabase, separados de la parte visual.
- `src/lib/`: Código auxiliar genérico o de terceros. De momento aloja la conexión pura a Supabase.
- `src/index.css`: Archivo central de estilos globales, colores y temas claro/oscuro de la aplicación web.
- `src/App.jsx`: El "gran distribuidor" de rutas, que decide qué página mostrar dependiendo del enlace (URL) en el que esté el usuario.
- `src/main.jsx`: El punto de inicio absoluto de la aplicación. Coge la aplicación y la inyecta en la página web real generada en `index.html`.

## 3. Flujo de Datos

**Frontend (React) <---> Servicios (Adaptadores) <---> Backend (Supabase)**

La web funciona como una "App" que se ejecuta plenamente en el dispositivo del cliente (SPA: Single Page Application). 
1. Cuando el usuario pulsa en "Guardar Nuevo Pedido", la vista (por ejemplo, `NewOrder.jsx`) manda la orden a los servicios.
2. `OrderService` o `DbAdapter` transforman los datos de los huevos, la calle y el precio a un formato seguro.
3. El servicio se comunica por internet con **Supabase**, validando las credenciales de quien hace la petición.
4. Si Supabase, gracias a las RLS (Row Level Security - Políticas de seguridad por fila), permite la acción, se guarda en la base de datos y se actualiza la interfaz.

## 4. Archivos y Archivos Importantes a vigilar

* **`db.adapter.js`**: Este archivo concentra múltiples consultas de tipo C.R.U.D. (Crear, Leer, Actualizar, Borrar). Es un "traductor" entre nuestra lógica de React y base de datos SQL en Supabase.
* **`auth.service.js`**: Únicamente gestiona inicios de sesión, cierres de sesión y registros manejando los "Tokens JWT" localmente para mantener la cuenta abierta.
* **`catalog.service.js`**: Este archivo contiene el menú de huevos (`PRODUCTS`), los pueblos con sus horarios logísticos, e IVA. Aquí se puede cambiar rápidamente si sale un nuevo tipo de producto o se reparte en un pueblo nuevo.

## 5. Corriendo en Local

Para continuar el desarrollo, abre el terminal donde esté la raíz del proyecto y ejecuta:

```bash
# Insta todas las librerías necesarias (Solo primera vez)
npm install

# Arranca el servidor web local con Vite
npm run dev
```

Esto levantará una web en `http://localhost:5173/` aproximadamente de la cual podrás revisar todos los cambios en caliente.
