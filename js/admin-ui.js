// admin-ui.js — Adaptado al backend pero con dependencia en user a localstorage

requireAdmin();

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("open");
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("open");
}
function toggleDropdown() {
  document.getElementById("user-dropdown").classList.toggle("open");
}
document.addEventListener("click", e => {
  const menu = document.querySelector(".user-menu");
  const dd   = document.getElementById("user-dropdown");
  if (dd && menu && !menu.contains(e.target)) dd.classList.remove("open");
});

const SECTION_TITLES = {
  dashboard:      "Dashboard Administrativo",
  usuarios:       "Gestión de Usuarios",
  gastos:        "Supervisión de Gastos",
  solicitudes:    "Solicitudes",
  notificaciones: "Notificaciones",
  sistema:        "Estado del Sistema"
};

function showSection(name, linkEl) {
  document.querySelectorAll(".admin-section").forEach(s => s.classList.remove("active"));
  document.getElementById("section-" + name)?.classList.add("active");
  document.querySelectorAll(".nav-item[data-section]").forEach(a => a.classList.remove("active"));
  if (linkEl) linkEl.classList.add("active");
  document.getElementById("topbar-section-title").textContent = SECTION_TITLES[name] || name;

  const loaders = {
    dashboard:      () => { renderDashboardAdmin(); renderDashQuick(); },
    usuarios:       () => renderUsuarios(),
    gastos:        () => renderAdminGastos(),
    solicitudes:    () => { renderGestiones(); renderNotificaciones(); },
    notificaciones: () => { renderNotifHistorial(); poblarDestinatarios(); },
    sistema:        () => renderSistema()
  };
  loaders[name]?.();
  closeSidebar();
  return false;
}

function showPqrTab(tab, btn) {
  ["gestiones","mensajes"].forEach(t => {
    const el = document.getElementById("pqr-tab-" + t);
    if (el) el.classList.toggle("hidden", t !== tab);
  });
  document.querySelectorAll("#section-solicitudes .tab").forEach(b => {
    b.classList.remove("active");
    b.setAttribute("aria-selected", "false");
  });
  btn.classList.add("active");
  btn.setAttribute("aria-selected", "true");
}

function openModal(id)  { document.getElementById(id)?.classList.add("open"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("open"); }

document.querySelectorAll(".modal-overlay").forEach(o =>
  o.addEventListener("click", e => { if (e.target === o) o.classList.remove("open"); })
);

function selectNotifType(tipo) {
  ["individual","masiva"].forEach(t =>
    document.getElementById("btn-type-" + t)?.classList.toggle("active", t === tipo)
  );
  const wrap = document.getElementById("notif-destinatario-wrap");
  if (wrap) wrap.style.display = tipo === "individual" ? "block" : "none";
}

// ── Dashboard rápido ──
async function renderDashQuick() {
  try {
    const stats = await AdminAPI.stats();

    const uTbody = document.getElementById("dash-usuarios-tbody");
    if (uTbody && stats.ultimos_usuarios) {
      uTbody.innerHTML = stats.ultimos_usuarios.length === 0
        ? `<tr class="empty-row"><td colspan="3">Sin usuarios</td></tr>`
        : stats.ultimos_usuarios.map(u => `
            <tr>
              <td>${u.nombre}</td>
              <td><span class="badge ${u.activo ? 'badge-green' : 'badge-red'}">${u.activo ? 'Activo' : 'Bloqueado'}</span></td>
              <td style="font-size:0.8rem;color:var(--gray-500)">${fmtFecha(u.fechaRegistro)}</td>
            </tr>`).join("");
    }

    const gTbody = document.getElementById("dash-gestiones-tbody");
    if (gTbody && stats.ultimas_gestiones) {
      gTbody.innerHTML = stats.ultimas_gestiones.length === 0
        ? `<tr class="empty-row"><td colspan="3">Sin solicitudes</td></tr>`
        : stats.ultimas_gestiones.map(g => `
            <tr>
              <td style="font-size:0.82rem">${g.usuarioNombre}</td>
              <td style="font-size:0.82rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.titulo}</td>
              <td>${badgeEstado(g.estado)}</td>
            </tr>`).join("");
    }

    const badge = document.getElementById("badge-pqr");
    if (badge) {
      const sinResp = stats.notificaciones_sin_responder || 0;
      badge.textContent = sinResp;
      badge.style.display = sinResp > 0 ? "inline-block" : "none";
    }
  } catch (err) {
    console.error("Error en dash quick:", err.message);
  }
}

// ── Historial de notificaciones enviadas ──
async function renderNotifHistorial() {
  const tbody = document.getElementById("notif-historial-tbody");
  if (!tbody) return;
  try {
    const lista = await AdminAPI.listarNotifEnviadas();
    tbody.innerHTML = lista.length === 0
      ? `<tr class="empty-row"><td colspan="5">No se han enviado notificaciones</td></tr>`
      : lista.map(n => `
          <tr>
            <td>${n.destinatario}</td>
            <td>${n.asunto}</td>
            <td style="font-size:0.82rem;max-width:200px">${n.mensaje}</td>
            <td style="font-size:0.8rem;color:var(--gray-500)">${fmtFecha(n.fecha)}</td>
            <td><span class="badge badge-cyan">${n.tipo}</span></td>
          </tr>`).join("");
  } catch (err) {
    showToast("❌ " + err.message);
  }
}

async function poblarDestinatarios() {
  const sel = document.getElementById("notif-destinatario");
  if (!sel) return;
  try {
    const usuarios = await AdminAPI.listarUsuarios();
    sel.innerHTML = `<option value="">Seleccionar usuario...</option>` +
      usuarios.filter(u => u.activo)
              .map(u => `<option value="${u.id}">${u.nombre} (${u.correo})</option>`).join("");
  } catch (err) {
    console.error("Error poblando destinatarios:", err.message);
  }
}

async function enviarNotificacion() {
  const tipo    = document.getElementById("btn-type-masiva")?.classList.contains("active") ? "Masiva" : "Individual";
  const asunto  = document.getElementById("notif-asunto")?.value.trim();
  const mensaje = document.getElementById("notif-mensaje")?.value.trim();
  const destId  = document.getElementById("notif-destinatario")?.value;

  if (!asunto || !mensaje) { showToast("Asunto y mensaje son obligatorios."); return; }
  if (tipo === "Individual" && !destId) { showToast("Selecciona un destinatario."); return; }

  try {
    await AdminAPI.enviarNotificacion({ tipo, asunto, mensaje, destinatario_id: destId || null });
    document.getElementById("notif-asunto").value  = "";
    document.getElementById("notif-mensaje").value = "";
    renderNotifHistorial();
    showToast("Notificación enviada ✓");
  } catch (err) {
    showToast("❌ " + err.message);
  }
}

// ── Sistema ──
async function renderSistema() {
  try {
    const stats = await AdminAPI.stats();
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("sys-activos",    stats.usuarios_activos);
    set("sys-bloqueados", stats.usuarios_bloqueados);
    set("sys-gastos",    stats.gastos_activos);
    set("sys-pendientes", stats.gestiones_pendientes);
    set("sys-last-update", new Date().toLocaleString("es-CO", { dateStyle:"medium", timeStyle:"short" }));
  } catch (err) {
    console.error("Error en sistema:", err.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const name = user.nombre || "Administrador";
  const mail = user.correo || "admin@syncpago.com";

  const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  setTxt("sidebar-admin-name",  name);
  setTxt("sidebar-admin-email", mail);
  setTxt("username-display",    name.split(" ")[0]);
  setTxt("fullname-display",    name);
  setTxt("email-display",       mail);

  showSection("dashboard", document.querySelector("[data-section='dashboard']"));
});