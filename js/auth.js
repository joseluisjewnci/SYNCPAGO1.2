// ============================================================
// auth.js — Autenticación con roles (cliente / administrador)
// HU-ADM-01: Acceso según rol
// HU-ADM-02: Login con credenciales y redirección correcta
// ============================================================
 
// Credenciales de administrador para el prototipo
// En producción esto vendría del backend
const ADMIN_EMAIL    = "admin@syncpago.com";
const ADMIN_PASSWORD = "admin123";
 
// ─── LOGIN ───────────────────────────────────────────────────
async function login(email, password, rol = "cliente") {
 
  // ── Modo administrador (prototipo sin backend real) ────────
  if (rol === "administrador") {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem("token", "admin-token");
      localStorage.setItem("user", JSON.stringify({
        nombre: "Administrador",
        correo: ADMIN_EMAIL,
        rol:    "administrador"
      }));
      _inicializarDatosAdmin(); // Carga datos de prueba si no existen
      window.location.href = "admin.html";
    } else {
      // HU-ADM-02 Escenario 2: Credenciales incorrectas
      alert("Acceso denegado. Credenciales de administrador incorrectas.");
    }
    return;
  }
 
  // ── Modo cliente ───────────────────────────────────────────
  try {
    // FIX: endpoint corregido de /index a /login
    const response = await fetch("http://127.0.0.1:8000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: email, password: password })
    });
 
    const data = await response.json();
 
    if (!data.success) { alert(data.mensaje); return; }
 
    const usuario = data.usuario || {};
    usuario.rol   = "cliente"; // Los usuarios normales siempre son clientes
    localStorage.setItem("token", data.token || "usuario-autenticado");
    localStorage.setItem("user", JSON.stringify(usuario));
    _registrarUsuarioEnLista(usuario); // Registra en la lista de usuarios del admin
    window.location.href = "dashboard.html";
 
  } catch (error) {
    // Modo demo sin backend
    console.warn("Backend no disponible, modo demo:", error);
    const nombre = email.split("@")[0];
    const usuario = {
      nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
      correo: email,
      rol:    "cliente"
    };
    localStorage.setItem("token", "demo-token");
    localStorage.setItem("user", JSON.stringify(usuario));
    _registrarUsuarioEnLista(usuario);
    window.location.href = "dashboard.html";
  }
}
 
// ─── REGISTRO ────────────────────────────────────────────────
async function register(name, email, phone, password) {
  try {
    const response = await fetch("http://127.0.0.1:8000/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: name, correo: email, celular: phone, password: password })
    });
    const data = await response.json();
    alert(data.mensaje);
    if (data.success) window.location.href = "index.html";
  } catch (error) {
    console.warn("Backend no disponible:", error);
    alert("Cuenta creada exitosamente (modo demo).");
    window.location.href = "index.html";
  }
}
 
// ─── FORGOT PASSWORD ─────────────────────────────────────────
async function forgotPassword(email) {
  try {
    await fetch("http://127.0.0.1:8000/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo: email })
    });
  } catch (error) {
    console.warn("Backend no disponible:", error);
  }
}
 
// ─── LOGOUT ──────────────────────────────────────────────────
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}
 
// ─── GUARD CLIENTE ───────────────────────────────────────────
// RF-004 / RF-036: Proteger páginas de clientes
function requireAuth() {
  const token = localStorage.getItem("token");
  if (!token) { window.location.href = "index.html"; return; }
 
  const user = JSON.parse(localStorage.getItem("user") || "{}");
 
  // HU-ADM-01 Escenario 2: Si un cliente intenta acceder a admin, bloqueado
  // (esto se maneja en requireAdmin)
  // Si un admin intenta acceder a páginas de cliente, lo redirigimos al panel admin
  if (user.rol === "administrador") {
    window.location.href = "admin.html";
    return;
  }
 
  _poblarDOM(user);
}
 
// ─── GUARD ADMINISTRADOR ─────────────────────────────────────
// HU-ADM-01: Solo administradores acceden al panel admin
function requireAdmin() {
  const token = localStorage.getItem("token");
  if (!token) { window.location.href = "index.html"; return; }
 
  const user = JSON.parse(localStorage.getItem("user") || "{}");
 
  // HU-ADM-01 Escenario 2: Acceso denegado para no-admins
  if (user.rol !== "administrador") {
    alert("Acceso denegado. No tienes permisos de administrador.");
    window.location.href = "index.html";
    return;
  }
 
  _poblarDOM(user);
}
 
// ─── HELPERS INTERNOS ────────────────────────────────────────
function _poblarDOM(user) {
  const nombre = user.nombre || user.name  || "Usuario";
  const correo = user.correo || user.email || "";
  const ids = {
    "username-display": nombre,
    "welcome-name":     nombre.split(" ")[0],
    "fullname-display": nombre,
    "email-display":    correo
  };
  Object.entries(ids).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}
 
// Registra al usuario en la lista global de usuarios (para que admin los vea)
function _registrarUsuarioEnLista(usuario) {
  const lista = JSON.parse(localStorage.getItem("sp_usuarios") || "[]");
  const existe = lista.find(u => u.correo === usuario.correo);
  if (!existe) {
    lista.push({
      id:      Date.now(),
      nombre:  usuario.nombre,
      correo:  usuario.correo,
      celular: usuario.celular || "",
      rol:     "cliente",
      activo:  true,
      fechaRegistro: new Date().toISOString().split("T")[0]
    });
    localStorage.setItem("sp_usuarios", JSON.stringify(lista));
  }
}
 
// Inicializa datos de prueba para el admin en el prototipo
function _inicializarDatosAdmin() {
  // Solo crea datos si no existen
  if (!localStorage.getItem("sp_usuarios")) {
    localStorage.setItem("sp_usuarios", JSON.stringify([
      { id: 1, nombre: "Juan Pérez",  correo: "juan@email.com",  celular: "3001234567", rol: "cliente", activo: true,  fechaRegistro: "2026-05-10" },
      { id: 2, nombre: "María López", correo: "maria@email.com", celular: "3109876543", rol: "cliente", activo: true,  fechaRegistro: "2026-05-15" },
      { id: 3, nombre: "Carlos Ruiz", correo: "carlos@email.com",celular: "3207654321", rol: "cliente", activo: false, fechaRegistro: "2026-05-20" }
    ]));
  }
  if (!localStorage.getItem("sp_gestiones")) {
    localStorage.setItem("sp_gestiones", JSON.stringify([
      { id: 1, titulo: "Error al registrar recibo",    descripcion: "No me deja guardar el recibo de arriendo.", estado: "Pendiente",   fecha: "2026-06-01", userId: 1, usuarioNombre: "Juan Pérez"  },
      { id: 2, titulo: "Cambio de correo electrónico", descripcion: "Necesito actualizar mi correo en el sistema.", estado: "En proceso", fecha: "2026-06-03", userId: 2, usuarioNombre: "María López" },
      { id: 3, titulo: "Eliminar cuenta",              descripcion: "Deseo eliminar mi cuenta permanentemente.", estado: "Resuelto",   fecha: "2026-05-28", userId: 3, usuarioNombre: "Carlos Ruiz" }
    ]));
  }
  if (!localStorage.getItem("sp_notificaciones")) {
    localStorage.setItem("sp_notificaciones", JSON.stringify([
      { id: 1, mensaje: "¿Por qué me cobran doble en el recibo de luz?", respuesta: "", estado: "Sin responder", fecha: "2026-06-05", userId: 1, usuarioNombre: "Juan Pérez"  },
      { id: 2, mensaje: "Mi contraseña no funciona desde ayer.",         respuesta: "Hemos restablecido tu contraseña. Revisa tu correo.", estado: "Respondida", fecha: "2026-06-04", userId: 2, usuarioNombre: "María López" }
    ]));
  }
}
 