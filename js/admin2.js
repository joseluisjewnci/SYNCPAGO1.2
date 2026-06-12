requireAdmin();

  // ── Sidebar / layout ──────────────────────────────────────
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

  // ── Section navigation ────────────────────────────────────
    const SECTION_TITLES = {
        dashboard:      "Dashboard Administrativo",
        usuarios:       "Gestión de Usuarios",
        recibos:        "Supervisión de Recibos",
        solicitudes:    "Solicitudes",
        notificaciones: "Notificaciones",
        sistema:        "Estado del Sistema"
    };

  function showSection(name, linkEl) {
    // Hide all sections
    document.querySelectorAll(".admin-section").forEach(s => s.classList.remove("active"));
    document.getElementById("section-" + name)?.classList.add("active");

    // Update nav active state
    document.querySelectorAll(".nav-item[data-section]").forEach(a => a.classList.remove("active"));
    if (linkEl) linkEl.classList.add("active");

    // Update topbar title
    document.getElementById("topbar-section-title").textContent = SECTION_TITLES[name] || name;

    // Load data for active section
    const loaders = {
      dashboard:      () => { renderDashboardAdmin(); renderDashQuick(); },
      usuarios:       () => renderUsuarios(),
      recibos:        () => renderAdminRecibos(),
      solicitudes:    () => { renderGestiones(); renderNotificaciones(); },
      notificaciones: () => { renderNotifHistorial(); poblarDestinatarios(); },
      sistema:        () => renderSistema()
    };
    loaders[name]?.();

    // Close mobile sidebar
    closeSidebar();
    return false;
  }

  // ── PQR sub-tabs ─────────────────────────────────────────
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

  // ── Modal helpers ─────────────────────────────────────────
  function openModal(id)  { document.getElementById(id)?.classList.add("open"); }
  function closeModal(id) { document.getElementById(id)?.classList.remove("open"); }

  document.querySelectorAll(".modal-overlay").forEach(o =>
    o.addEventListener("click", e => { if (e.target === o) o.classList.remove("open"); })
  );

  // ── Notif type toggle ─────────────────────────────────────
  function selectNotifType(tipo) {
    ["individual","masiva"].forEach(t =>
      document.getElementById("btn-type-" + t)?.classList.toggle("active", t === tipo)
    );
    const wrap = document.getElementById("notif-destinatario-wrap");
    if (wrap) wrap.style.display = tipo === "individual" ? "block" : "none";
  }

  // ── Dashboard quick tables ────────────────────────────────
  function renderDashQuick() {
    const usuarios  = JSON.parse(localStorage.getItem("sp_usuarios")  || "[]");
    const gestiones = JSON.parse(localStorage.getItem("sp_gestiones") || "[]");

    // Last 5 users
    const uTbody = document.getElementById("dash-usuarios-tbody");
    if (uTbody) {
      const recent = [...usuarios].reverse().slice(0, 5);
      uTbody.innerHTML = recent.length === 0
        ? `<tr class="empty-row"><td colspan="3">Sin usuarios</td></tr>`
        : recent.map(u => `
            <tr>
              <td>${u.nombre}</td>
              <td><span class="badge ${u.activo ? 'badge-green' : 'badge-red'}">${u.activo ? 'Activo' : 'Bloqueado'}</span></td>
              <td style="font-size:0.8rem;color:var(--gray-500)">${fmtFecha(u.fechaRegistro)}</td>
            </tr>`).join("");
    }

    // Last 5 gestiones
    const gTbody = document.getElementById("dash-gestiones-tbody");
    if (gTbody) {
      const recent = [...gestiones].reverse().slice(0, 5);
      gTbody.innerHTML = recent.length === 0
        ? `<tr class="empty-row"><td colspan="3">Sin solicitudes</td></tr>`
        : recent.map(g => `
            <tr>
              <td style="font-size:0.82rem">${g.usuarioNombre}</td>
              <td style="font-size:0.82rem;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${g.titulo}</td>
              <td>${badgeEstado(g.estado)}</td>
            </tr>`).join("");
    }

    // Badge PQR
    const sinResp = JSON.parse(localStorage.getItem("sp_notificaciones") || "[]")
      .filter(n => n.estado === "Sin responder").length;
    const badge = document.getElementById("badge-pqr");
    if (badge) {
      badge.textContent = sinResp;
      badge.style.display = sinResp > 0 ? "inline-block" : "none";
    }
  }

  // ── Notif historial ───────────────────────────────────────
  function renderNotifHistorial() {
    const tbody = document.getElementById("notif-historial-tbody");
    if (!tbody) return;
    const lista = JSON.parse(localStorage.getItem("sp_notif_enviadas") || "[]");
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
  }

  function poblarDestinatarios() {
    const sel = document.getElementById("notif-destinatario");
    if (!sel) return;
    const usuarios = JSON.parse(localStorage.getItem("sp_usuarios") || "[]");
    sel.innerHTML = `<option value="">Seleccionar usuario...</option>` +
      usuarios.filter(u => u.activo)
              .map(u => `<option value="${u.id}">${u.nombre} (${u.correo})</option>`).join("");
  }

  function enviarNotificacion() {
    const tipo     = document.getElementById("btn-type-masiva")?.classList.contains("active") ? "Masiva" : "Individual";
    const asunto   = document.getElementById("notif-asunto")?.value.trim();
    const mensaje  = document.getElementById("notif-mensaje")?.value.trim();
    const destId   = document.getElementById("notif-destinatario")?.value;

    if (!asunto || !mensaje) { showToast("Asunto y mensaje son obligatorios."); return; }
    if (tipo === "Individual" && !destId) { showToast("Selecciona un destinatario."); return; }

    const usuarios = JSON.parse(localStorage.getItem("sp_usuarios") || "[]");
    let destinatario = "Todos los usuarios";
    if (tipo === "Individual") {
      const u = usuarios.find(u => u.id == destId);
      destinatario = u ? `${u.nombre}` : "—";
    }

    const historial = JSON.parse(localStorage.getItem("sp_notif_enviadas") || "[]");
    historial.unshift({
      id:          Date.now(),
      destinatario,
      asunto,
      mensaje,
      tipo,
      fecha:       new Date().toISOString().split("T")[0]
    });
    localStorage.setItem("sp_notif_enviadas", JSON.stringify(historial));

    document.getElementById("notif-asunto").value  = "";
    document.getElementById("notif-mensaje").value = "";
    renderNotifHistorial();
    showToast("Notificación enviada ✓");
  }

  // ── Sistema ───────────────────────────────────────────────
  function renderSistema() {
    const usuarios  = JSON.parse(localStorage.getItem("sp_usuarios")  || "[]");
    const gastos    = JSON.parse(localStorage.getItem("gastos")        || "[]");
    const gestiones = JSON.parse(localStorage.getItem("sp_gestiones") || "[]");

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set("sys-activos",    usuarios.filter(u => u.activo).length);
    set("sys-bloqueados", usuarios.filter(u => !u.activo).length);
    set("sys-recibos",    gastos.filter(g => g.activo).length);
    set("sys-pendientes", gestiones.filter(g => g.estado === "Pendiente" || g.estado === "En proceso").length);

    const now = new Date();
    set("sys-last-update", now.toLocaleString("es-CO", { dateStyle:"medium", timeStyle:"short" }));
  }

  // ── Populate sidebar user info ────────────────────────────
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

    // Load initial section
    showSection("dashboard", document.querySelector("[data-section='dashboard']"));
  });