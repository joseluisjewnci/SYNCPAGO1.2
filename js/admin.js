// admin.js — Adaptado al backend real

function fmtFecha(str) {
  if (!str) return "—";
  return new Date(str + "T12:00:00").toLocaleDateString("es-CO", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function badgeEstado(estado) {
  const map = {
    "Pendiente":     "badge-yellow",
    "En proceso":    "badge-cyan",
    "Resuelto":      "badge-green",
    "Sin responder": "badge-red",
    "Respondida":    "badge-green"
  };
  return `<span class="badge ${map[estado] || "badge-yellow"}">${estado}</span>`;
}

function showAdminTab(tabId, btn) {
  document.querySelectorAll(".admin-tab-content").forEach(t => t.classList.add("hidden"));
  document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(tabId)?.classList.remove("hidden");
  btn.classList.add("active");

  if (tabId === "tab-usuarios")       renderUsuarios();
  if (tabId === "tab-gastoss")        renderAdminGastos();
  if (tabId === "tab-gestiones")      renderGestiones();
  if (tabId === "tab-notificaciones") renderNotificaciones();
}

// ── Dashboard stats ──
async function renderDashboardAdmin() {
  try {
    const stats = await AdminAPI.stats();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("stat-usuarios",  stats.usuarios_activos);
    set("stat-gastos",   stats.gastos_activos);
    set("stat-gestiones", stats.gestiones_pendientes);
    set("stat-sinresp",   stats.notificaciones_sin_responder);
  } catch (err) {
    console.error("Error cargando stats admin:", err.message);
  }
}

// ── Usuarios ──
async function renderUsuarios(filtro = "") {
  const tbody = document.getElementById("admin-usuarios-tbody");
  if (!tbody) return;
  try {
    const lista = await AdminAPI.listarUsuarios(filtro);

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
        <td><span class="badge ${u.activo ? 'badge-green' : 'badge-red'}">${u.activo ? "Activo" : "Bloqueado"}</span></td>
        <td>
          <button class="action-btn" onclick="toggleUsuario(${u.id})" title="${u.activo ? 'Bloquear' : 'Activar'}">
            ${u.activo ? "🔒" : "🔓"}
          </button>
        </td>
      </tr>`).join("");
  } catch (err) {
    showToast("❌ " + err.message);
  }
}

async function toggleUsuario(id) {
  try {
    const res = await AdminAPI.toggleUsuario(id);
    renderUsuarios();
    showToast(res.activo ? "Usuario activado ✓" : "Usuario bloqueado ✓");
    renderDashboardAdmin();
  } catch (err) {
    showToast("❌ " + err.message);
  }
}

async function agregarUsuarioAdmin() {
  const nombre  = document.getElementById("new-user-nombre")?.value.trim();
  const correo  = document.getElementById("new-user-correo")?.value.trim();
  const celular = document.getElementById("new-user-cel")?.value.trim();

  if (!nombre || !correo || !correo.includes("@")) {
    showToast("Nombre y correo válidos son obligatorios.");
    return;
  }

  try {
    await AdminAPI.crearUsuario({ nombre, correo, celular });
    document.getElementById("modal-nuevo-usuario")?.classList.remove("open");
    document.getElementById("new-user-nombre").value = "";
    document.getElementById("new-user-correo").value = "";
    document.getElementById("new-user-cel").value    = "";
    renderUsuarios();
    renderDashboardAdmin();
    showToast("Usuario registrado ✓");
  } catch (err) {
    showToast("❌ " + err.message);
  }
}

// ── Gastoss admin ──
async function renderAdminGastos() {
  const tbody = document.getElementById("admin-gastos-tbody");
  if (!tbody) return;

  const estadoFiltro = document.getElementById("admin-filter-estado")?.value || "";
  const catFiltro    = document.getElementById("admin-filter-cat")?.value    || "";
  const textFiltro   = (document.getElementById("admin-search-gasto")?.value || "").toLowerCase();

  try {
    const lista = await AdminAPI.listarGastos({
      estado:    estadoFiltro || undefined,
      categoria: catFiltro    || undefined,
      nombre:    textFiltro   || undefined
    });

    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400)">Sin gastos</td></tr>`;
      return;
    }

    tbody.innerHTML = lista.map(g => {
      const estado = _getEstadoGasto(g);
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
  } catch (err) {
    showToast("❌ " + err.message);
  }
}

function _getEstadoGasto(g) {
  if (g.estado === "Pagado") return "Pagado";
  const diff = Math.ceil((new Date(g.fecha + "T12:00:00") - new Date()) / 86400000);
  if (diff < 0)   return "Vencido";
  if (diff === 0) return "Hoy";
  return "Pendiente";
}

// ── Gestiones ──
async function renderGestiones() {
  const tbody = document.getElementById("admin-gestiones-tbody");
  if (!tbody) return;

  const estadoFiltro = document.getElementById("admin-filter-gestion")?.value || "";

  try {
    const lista = await AdminAPI.listarGestiones({ estado: estadoFiltro || undefined });

    if (lista.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--gray-400)">Sin gestiones</td></tr>`;
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
          <select class="filter-btn" onchange="cambiarEstadoGestion(${g.id}, this.value)" style="padding:4px 8px;font-size:0.8rem;">
            <option value="Pendiente"  ${g.estado==="Pendiente"  ? "selected":""}>Pendiente</option>
            <option value="En proceso" ${g.estado==="En proceso" ? "selected":""}>En proceso</option>
            <option value="Resuelto"   ${g.estado==="Resuelto"   ? "selected":""}>Resuelto</option>
          </select>
        </td>
      </tr>`).join("");
  } catch (err) {
    showToast("❌ " + err.message);
  }
}

async function cambiarEstadoGestion(id, nuevoEstado) {
  try {
    await AdminAPI.cambiarEstadoGestion(id, nuevoEstado);
    renderGestiones();
    renderDashboardAdmin();
    showToast("Estado actualizado ✓");
  } catch (err) {
    showToast("❌ " + err.message);
  }
}

// ── Notificaciones ──
async function renderNotificaciones() {
  const tbody = document.getElementById("admin-notif-tbody");
  if (!tbody) return;
  try {
    const lista = await AdminAPI.listarNotificaciones();

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
  } catch (err) {
    showToast("❌ " + err.message);
  }
}

async function abrirRespuesta(id) {
  try {
    const lista = await AdminAPI.listarNotificaciones();
    const notif = lista.find(n => n.id === id);
    if (!notif) return;

    document.getElementById("resp-id").value             = id;
    document.getElementById("resp-usuario").textContent  = notif.usuarioNombre;
    document.getElementById("resp-mensaje").textContent  = notif.mensaje;
    document.getElementById("resp-texto").value          = "";
    document.getElementById("modal-respuesta").classList.add("open");
  } catch (err) {
    showToast("❌ " + err.message);
  }
}

async function enviarRespuesta() {
  const id       = Number(document.getElementById("resp-id").value);
  const respuesta = document.getElementById("resp-texto").value.trim();

  if (!respuesta) {
    showToast("Debes escribir una respuesta.");
    return;
  }

  try {
    await AdminAPI.responderNotificacion(id, respuesta);
    document.getElementById("modal-respuesta").classList.remove("open");
    renderNotificaciones();
    renderDashboardAdmin();
    showToast("Respuesta enviada ✓");
  } catch (err) {
    showToast("❌ " + err.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderDashboardAdmin();
});

window.showAdminTab         = showAdminTab;
window.renderUsuarios       = renderUsuarios;
window.toggleUsuario        = toggleUsuario;
window.agregarUsuarioAdmin  = agregarUsuarioAdmin;
window.renderAdminGastos   = renderAdminGastos;
window.renderGestiones      = renderGestiones;
window.cambiarEstadoGestion = cambiarEstadoGestion;
window.renderNotificaciones = renderNotificaciones;
window.abrirRespuesta       = abrirRespuesta;
window.enviarRespuesta      = enviarRespuesta;