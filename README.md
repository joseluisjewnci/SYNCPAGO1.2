# SYNCPAGO Frontend

Este proyecto contiene la interfaz web del sistema SYNCPAGO, desarrollada con HTML, CSS y JavaScript puro. Su finalidad es permitir a los usuarios gestionar gastos, recibos, recordatorios y visualizar un resumen financiero de manera sencilla, además de incluir un panel administrativo para supervisar usuarios, recibos, solicitudes y notificaciones.

## 1. Descripción general

La carpeta Frontend está organizada como una aplicación web estática con páginas independientes y lógica JavaScript para:

- iniciar sesión y registrarse,
- manejar gastos y recibos,
- visualizar un dashboard,
- consultar historial,
- configurar recordatorios,
- ver estadísticas por categoría y mes,
- administrar usuarios, solicitudes y notificaciones desde un panel interno.

La información se guarda principalmente en `localStorage`, por lo que el frontend funciona sin una base de datos propia.

## 2. Estructura de carpetas

### `pages/`
Contiene todas las pantallas de la aplicación:

- `index.html` — inicio de sesión.
- `register.html` — creación de cuenta.
- `forgot-password.html` — recuperación de contraseña.
- `dashboard.html` — resumen general y bienvenida.
- `admin.html` — panel administrativo con gestión de usuarios, recibos, solicitudes y notificaciones.
- `gastos.html` — gestión de recibos y gastos.
- `recordatorios.html` — configuración de alertas y notificaciones.
- `historial.html` — historial de pagos y recibos.
- `insights.html` — estadísticas por categoría y mes.

### `js/`
Contiene la lógica de interacción del frontend:

- `auth.js` — login, registro, recuperación de contraseña, cierre de sesión y validación básica.
- `dashboard.js` — cálculos del resumen financiero del dashboard.
- `admin.js` — lógica del panel administrativo: usuarios, recibos, gestiones y respuestas.
- `admin2.js` — navegación, menús, notificaciones masivas, historial de envíos y estado del sistema.
- `gastos.js` — creación, edición, filtros, paginación y estado de los recibos.
- `historial.js` — visualización y filtros del historial.
- `recordatorios.js` — preferencias de notificaciones y alertas.
- `utils.js` — funciones auxiliares como moneda, formato y mensajes emergentes.
- `i18n.js` — soporte básico de idioma español/inglés.

### `css/`
Archivos de estilos para la interfaz:

- `base.css` — estilos base generales.
- `auth.css` — diseño de formularios de acceso.
- `layout.css` — estructura general de la app.
- `components.css` — botones, tarjetas, tablas y modales.
- `dashboard.css` — estilos del dashboard y gráficos.
- `admin.css` — estilos específicos del panel administrativo.
- `responsive.css` — diseño adaptable para móviles y pantallas pequeñas.
- `variables.css` — variables de colores, tipografía y tamaños.

### `img/`
Carpeta para recursos visuales e íconos usados por la interfaz.

## 3. Funcionalidades principales

### Autenticación
- Login con correo y contraseña.
- Registro de nuevos usuarios.
- Recuperación de contraseña.
- Cierre de sesión.

### Gestión de recibos
- Crear, editar y eliminar recibos.
- Filtrar por categoría, estado o texto.
- Paginación en listados.
- Marcar como pagado o pendiente.

### Dashboard y estadísticas
- Resumen de gastos del mes.
- Totales de pagados, pendientes y vencidos.
- Visualización por categorías.

### Recordatorios
- Configuración de alertas por WhatsApp.
- Control de días de anticipación.
- Personalización del mensaje de notificación.

### Panel administrativo
- Gestión de usuarios activos y bloqueados.
- Supervisión de recibos y estado financiero.
- Seguimiento de solicitudes y PQR.
- Envío de notificaciones individuales o masivas.
- Vista del estado general del sistema.

### Historial
- Consulta del historial completo de recibos.
- Filtros por estado, categoría y rango de fechas.

## 4. Cómo ejecutar el frontend

Este frontend funciona como una aplicación estática, por lo que puede abrirse directamente en el navegador.

1. Abre cualquiera de los archivos HTML dentro de `pages/`, por ejemplo `pages/index.html`.
2. Para acceder al panel administrativo, abre `pages/admin.html`.
3. Si prefieres usar un servidor local, puedes ejecutar:

   ```bash
   python -m http.server 3000
   ```

   Y luego abrir:

   ```text
   http://localhost:3000/pages/index.html
   ```

## 5. Tecnologías usadas

- HTML5
- CSS3
- JavaScript vanilla
- `localStorage` para persistencia simple del lado del cliente

## 6. Resumen rápido

La carpeta `Frontend` es la capa visual e interactiva de SYNCPAGO. Su objetivo principal es ayudar al usuario a:

- organizar sus finanzas,
- registrar pagos,
- configurar alertas,
- revisar su historial y tendencias de gasto mensual.
