// ============================================================
// admin.js — Panel de Administrador
// HU-ADM-03: Gestionar usuarios
// HU-ADM-04: Supervisar recibos
// HU-ADM-05: Supervisar gestiones administrativas
// HU-ADM-06: Responder solicitudes de clientes
// ============================================================

// ─── HELPERS ─────────────────────────────────────────────────

function fmtFecha(str) {
  if (!str) return "—";
  return new Date(str + "T12:00:00").toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function badgeEstado(estado) {
  const map = {
    "Pendiente":    "badge-yellow",
    "En proceso":   "badge-cyan",
    "Resuelto":     "badge-green",
    "Sin responder":"badge-red",
    "Respondida":   "badge-green"
  };
  return `<span class="badge ${map[estado] || "badge-yellow"}">${estado}</span>`;
}

// ─── TAB NAVIGATION ──────────────────────────────────────────

function showAdminTab(tabId, btn) {
  document.querySelectorAll(".admin-tab-content").forEach(t => t.classList.add("hidden"));
  document.querySelectorAll(".admin-tab-btn").forEach(b => { b.classList.remove("active"); });
  document.getElementById(tabId)?.classList.remove("hidden");
  btn.classList.add("active");

  // Cargar datos de la sección activa
  if (tabId === "tab-usuarios")     renderUsuarios();
  if (tabId === "tab-recibos")      renderAdminRecibos();
  if (tabId === "tab-gestiones")    renderGestiones();
  if (tabId === "tab-notificaciones") renderNotificaciones();
}

// ─── PANEL PRINCIPAL — ESTADÍSTICAS ──────────────────────────

function renderDashboardAdmin() {
  const usuarios     = JSON.parse(localStorage.getItem("sp_usuarios")      || "[]");
  const gestiones    = JSON.parse(localStorage.getItem("sp_gestiones")     || "[]");
  const notifs       = JSON.parse(localStorage.getItem("sp_notificaciones") || "[]");
  const todosGastos  = JSON.parse(localStorage.getItem("gastos")           || "[]");

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set("stat-usuarios",   usuarios.filter(u => u.activo).length);
  set("stat-recibos",    todosGastos.filter(g => g.activo).length);
  set("stat-gestiones",  gestiones.filter(g => g.estado === "Pendiente" || g.estado === "En proceso").length);
  set("stat-sinresp",    notifs.filter(n => n.estado === "Sin responder").length);
}

// ─── HU-ADM-03: GESTIÓN DE USUARIOS ─────────────────────────

function renderUsuarios(filtro = "") {
  const tbody = document.getElementById("admin-usuarios-tbody");
  if (!tbody) return;

  let lista = JSON.parse(localStorage.getItem("sp_usuarios") || "[]");

  if (filtro) {
    lista = lista.filter(u =>
      u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      u.correo.toLowerCase().includes(filtro.toLowerCase())
    );
  }

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400)">Sin usuarios registrados</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(u => `
    <tr style="${!u.activo ? 'opacity:0.5' : ''}">
      <td>${u.nombre}</td>
      <td>${u.correo}</td>
      <td>${u.celular || "—"}</td>
      <td>${fmtFecha(u.fechaRegistro)}</td>
      <td>
        <span class="badge ${u.activo ? 'badge-green' : 'badge-red'}">
          ${u.activo ? "Activo" : "Bloqueado"}
        </span>
      </td>
      <td>
        <button class="action-btn" onclick="toggleUsuario(${u.id})"
          title="${u.activo ? 'Bloquear usuario' : 'Activar usuario'}">
          ${u.activo ? "🔒" : "🔓"}
        </button>
      </td>
    </tr>`).join("");
}

// HU-ADM-03 Escenario 2: Bloquear / activar usuario
function toggleUsuario(id) {
  const lista = JSON.parse(localStorage.getItem("sp_usuarios") || "[]");
  const user  = lista.find(u => u.id === id);
  if (!user) return;

  user.activo = !user.activo;
  localStorage.setItem("sp_usuarios", JSON.stringify(lista));
  renderUsuarios();
  showToast(user.activo ? "Usuario activado ✓" : "Usuario bloqueado ✓");
  renderDashboardAdmin();
}

// HU-ADM-03 Escenario 1: Registrar nuevo usuario (admin lo crea manualmente)
function agregarUsuarioAdmin() {
  const nombre  = document.getElementById("new-user-nombre")?.value.trim();
  const correo  = document.getElementById("new-user-correo")?.value.trim();
  const celular = document.getElementById("new-user-cel")?.value.trim();

  if (!nombre || !correo || !correo.includes("@")) {
    showToast("Nombre y correo válidos son obligatorios.");
    return;
  }

  const lista = JSON.parse(localStorage.getItem("sp_usuarios") || "[]");
  if (lista.find(u => u.correo === correo)) {
    showToast("Ese correo ya está registrado.");
    return;
  }

  lista.push({
    id: Date.now(),
    nombre, correo, celular,
    rol: "cliente",
    activo: true,
    fechaRegistro: new Date().toISOString().split("T")[0]
  });

  localStorage.setItem("sp_usuarios", JSON.stringify(lista));
  document.getElementById("modal-nuevo-usuario")?.classList.remove("open");
  document.getElementById("new-user-nombre").value = "";
  document.getElementById("new-user-correo").value = "";
  document.getElementById("new-user-cel").value    = "";
  renderUsuarios();
  renderDashboardAdmin();
  showToast("Usuario registrado ✓");
}

// ─── HU-ADM-04: SUPERVISAR RECIBOS ──────────────────────────

function renderAdminRecibos(filtro = "") {
  const tbody = document.getElementById("admin-recibos-tbody");
  if (!tbody) return;

  let lista = JSON.parse(localStorage.getItem("gastos") || "[]").filter(g => g.activo);
  const usuarios = JSON.parse(localStorage.getItem("sp_usuarios") || "[]");

  const estadoFiltro = document.getElementById("admin-filter-estado")?.value || "";
  const catFiltro    = document.getElementById("admin-filter-cat")?.value    || "";
  const textFiltro   = (document.getElementById("admin-search-recibo")?.value || "").toLowerCase();

  if (estadoFiltro) lista = lista.filter(g => _getEstadoRecibo(g) === estadoFiltro);
  if (catFiltro)    lista = lista.filter(g => g.categoria === catFiltro);
  if (textFiltro)   lista = lista.filter(g => g.nombre.toLowerCase().includes(textFiltro));

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400)">Sin recibos registrados</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(g => {
    const estado = _getEstadoRecibo(g);
    const cls    = { Pagado:"badge-green", Vencido:"badge-red", Hoy:"badge-today", Pendiente:"badge-yellow" }[estado] || "badge-yellow";
    return `
    <tr>
      <td>${g.nombre}</td>
      <td>${g.categoria}</td>
      <td>${new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(g.monto)}</td>
      <td>${fmtFecha(g.fecha)}</td>
      <td><span class="badge ${cls}">${estado}</span></td>
      <td>${g.ciclo}</td>
    </tr>`;
  }).join("");
}

function _getEstadoRecibo(g) {
  if (g.estado === "Pagado") return "Pagado";
  const diff = Math.ceil((new Date(g.fecha + "T12:00:00") - new Date()) / 86400000);
  if (diff < 0)  return "Vencido";
  if (diff === 0) return "Hoy";
  return "Pendiente";
}

// ─── HU-ADM-05: GESTIONES ADMINISTRATIVAS ───────────────────

function renderGestiones(filtro = "") {
  const tbody = document.getElementById("admin-gestiones-tbody");
  if (!tbody) return;

  let lista = JSON.parse(localStorage.getItem("sp_gestiones") || "[]");
  const estadoFiltro = document.getElementById("admin-filter-gestion")?.value || "";

  if (estadoFiltro) lista = lista.filter(g => g.estado === estadoFiltro);
  if (filtro)       lista = lista.filter(g => g.titulo.toLowerCase().includes(filtro.toLowerCase()));

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400)">Sin gestiones registradas</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(g => `
    <tr>
      <td>${g.id}</td>
      <td>${g.usuarioNombre}</td>
      <td>${g.titulo}</td>
      <td>${fmtFecha(g.fecha)}</td>
      <td>${badgeEstado(g.estado)}</td>
      <td>
        <select class="filter-btn" onchange="cambiarEstadoGestion(${g.id}, this.value)"
          style="padding:4px 8px;font-size:0.8rem;">
          <option value="Pendiente"  ${g.estado==="Pendiente"  ? "selected":""}>Pendiente</option>
          <option value="En proceso" ${g.estado==="En proceso" ? "selected":""}>En proceso</option>
          <option value="Resuelto"   ${g.estado==="Resuelto"   ? "selected":""}>Resuelto</option>
        </select>
      </td>
    </tr>`).join("");
}

// HU-ADM-05 Escenario 2: Actualizar estado de gestión
function cambiarEstadoGestion(id, nuevoEstado) {
  const lista = JSON.parse(localStorage.getItem("sp_gestiones") || "[]");
  const item  = lista.find(g => g.id === id);
  if (!item) return;
  item.estado = nuevoEstado;
  localStorage.setItem("sp_gestiones", JSON.stringify(lista));
  renderGestiones();
  renderDashboardAdmin();
  showToast("Estado actualizado ✓");
}

// ─── HU-ADM-06: RESPONDER SOLICITUDES ───────────────────────

function renderNotificaciones() {
  const tbody = document.getElementById("admin-notif-tbody");
  if (!tbody) return;

  const lista = JSON.parse(localStorage.getItem("sp_notificaciones") || "[]");

  if (lista.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--gray-400)">Sin solicitudes</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(n => `
    <tr>
      <td>${n.usuarioNombre}</td>
      <td style="max-width:220px;font-size:0.83rem">${n.mensaje}</td>
      <td>${fmtFecha(n.fecha)}</td>
      <td>${badgeEstado(n.estado)}</td>
      <td>
        ${n.estado === "Sin responder"
          ? `<button class="action-btn" onclick="abrirRespuesta(${n.id})" title="Responder">✍️ Responder</button>`
          : `<span style="font-size:0.8rem;color:var(--gray-500)">${n.respuesta}</span>`
        }
      </td>
    </tr>`).join("");
}

// HU-ADM-06 Escenario 1: Abrir modal de respuesta
function abrirRespuesta(id) {
  const notifs = JSON.parse(localStorage.getItem("sp_notificaciones") || "[]");
  const notif  = notifs.find(n => n.id === id);
  if (!notif) return;

  document.getElementById("resp-id").value          = id;
  document.getElementById("resp-usuario").textContent  = notif.usuarioNombre;
  document.getElementById("resp-mensaje").textContent  = notif.mensaje;
  document.getElementById("resp-texto").value          = "";
  document.getElementById("modal-respuesta").classList.add("open");
}

// HU-ADM-06 Escenario 2: Guardar respuesta y actualizar estado notificación
function enviarRespuesta() {
  const id       = Number(document.getElementById("resp-id").value);
  const respuesta = document.getElementById("resp-texto").value.trim();

  // HU-ADM-06 Escenario 2: Campo vacío → solicitar completar
  if (!respuesta) {
    showToast("Debes escribir una respuesta antes de enviar.");
    document.getElementById("resp-texto").focus();
    return;
  }

  const notifs = JSON.parse(localStorage.getItem("sp_notificaciones") || "[]");
  const notif  = notifs.find(n => n.id === id);
  if (!notif) return;

  // HU-ADM-06: Guardar respuesta y actualizar estado
  notif.respuesta = respuesta;
  notif.estado    = "Respondida";
  localStorage.setItem("sp_notificaciones", JSON.stringify(notifs));

  document.getElementById("modal-respuesta").classList.remove("open");
  renderNotificaciones();
  renderDashboardAdmin();
  showToast("Respuesta enviada ✓");
}

// ─── INIT ────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  renderDashboardAdmin();
});

// Exponer funciones usadas en onclick del HTML
window.showAdminTab         = showAdminTab;
window.renderUsuarios       = renderUsuarios;
window.toggleUsuario        = toggleUsuario;
window.agregarUsuarioAdmin  = agregarUsuarioAdmin;
window.renderAdminRecibos   = renderAdminRecibos;
window.renderGestiones      = renderGestiones;
window.cambiarEstadoGestion = cambiarEstadoGestion;
window.renderNotificaciones = renderNotificaciones;
window.abrirRespuesta       = abrirRespuesta;
window.enviarRespuesta      = enviarRespuesta;