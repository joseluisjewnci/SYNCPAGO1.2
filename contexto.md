# Resumen del frontend de SYNCPAGO

## Estructura general
- css/: estilos visuales de toda la interfaz.
- js/: lógica de interacción, validaciones, filtros, moneda, idioma y manejo de datos.
- pages/: pantallas HTML que el usuario ve.
- img/: recursos gráficos e íconos.

## Archivos de estilos (más específicos)
- css/variables.css: define la paleta de colores, tipografías, sombras, radios y variables reutilizables usadas por todas las páginas de la app.
- css/base.css: aplica el reset general del proyecto, tipografía base, estilos de body, enlaces, botones, inputs y la clase `.hidden` que se usa en todas las vistas.
- css/auth.css: controla el diseño visual de las páginas de acceso: `index.html`, `register.html` y `forgot-password.html`. Aquí están los fondos degradados, contenedores de formulario, logos, campos, errores y botones principales.
- css/layout.css: define la estructura general de las páginas internas como `dashboard.html`, `gastos.html`, `recordatorios.html`, `historial.html` e `insights.html`: sidebar, topbar, menú de usuario, dropdown, contenido principal y encabezados de página.
- css/components.css: contiene los componentes reutilizables usados en varias pantallas internas: tablas de recibos, filtros, buscadores, paginación, botones de acción, modales, pestañas y mensajes tipo toast.
- css/dashboard.css: se enfoca en la vista del dashboard e insights: tarjetas KPI, banner de bienvenida, tarjetas de funciones, resumen mensual, barras de categorías y navegación por meses.
- css/responsive.css: ajusta el diseño para móviles y tablets: sidebar desplegable, ocultar/mostrar elementos, adaptación de tablas, modales y botones según el ancho de pantalla.

## Archivos JavaScript
- js/auth.js: login, registro, recuperación de contraseña, logout y protección de rutas.
- js/utils.js: toast, formato de moneda, cambio de divisa y fechas.
- js/i18n.js: soporte básico para español e inglés.
- js/dashboard.js: cálculos de totales del mes y resumen financiero.
- js/gastos.js: agregar, editar, eliminar, filtrar y paginar recibos/gastos.
- js/historial.js: historial con filtros por estado, categoría y fechas.
- js/recordatorios.js: preferencias de alertas y notificaciones.

## Archivos HTML
- pages/index.html: inicio de sesión.
- pages/register.html: creación de cuenta.
- pages/forgot-password.html: recuperación de contraseña.
- pages/dashboard.html: pantalla principal con resumen financiero.
- pages/gastos.html: administración de recibos/gastos.
- pages/recordatorios.html: configuración de recordatorios.
- pages/historial.html: historial completo.
- pages/insights.html: estadísticas por mes y categorías.

## Qué hace el frontend
Este frontend funciona como una app web estática para:
- registrar y organizar gastos,
- ver un resumen financiero,
- administrar recibos,
- configurar recordatorios,
- consultar historial y estadísticas,
- cambiar moneda e idioma.
