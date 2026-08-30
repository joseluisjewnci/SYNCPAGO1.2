// gastos.js — Adaptado al backend real con filtros completos

(function () {

  let listaActual  = [];
  let paginaActual = 1;
  const POR_PAGINA = 8;
  let editingId    = null;

  // ── Helpers de UI ──
  function getStatus(g) {
    if (g.estado === "Pagado") return { label: "Pagado", cls: "badge-green" };
    const diff = Math.ceil((new Date(g.fecha + "T12:00:00") - new Date()) / 86400000);
    if (diff < 0)   return { label: "Vencido",  cls: "badge-red" };
    if (diff === 0) return { label: "Hoy",       cls: "badge-today" };
    return              { label: "Pendiente", cls: "badge-yellow" };
  }

  function fmtFecha(f) {
    return new Date(f + "T12:00:00").toLocaleDateString("es-CO", {
      day: "2-digit", month: "short", year: "numeric"
    });
  }

  // ── Render tabla ──
  function renderGastos(lista) {
    listaActual = lista ?? listaActual;

    const tbody = document.getElementById("gastos-tbody");
    if (!tbody) return;

    const total  = Math.max(1, Math.ceil(listaActual.length / POR_PAGINA));
    if (paginaActual > total) paginaActual = total;

    const inicio = (paginaActual - 1) * POR_PAGINA;
    const pagina = listaActual.slice(inicio, inicio + POR_PAGINA);

    tbody.innerHTML = pagina.length === 0
      ? `<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--gray-400)">Sin gastos registrados</td></tr>`
      : pagina.map(g => {
          const st = getStatus(g);
          return `
          <tr>
            <td><span class="service-cell">
              <span class="color-dot" style="background:${g.color}"></span>
              ${g.nombre}
            </span></td>
            <td>${g.categoria}</td>
            <td>${formatMoney(g.monto)}</td>
            <td>${fmtFecha(g.fecha)}</td>
            <td>${g.ciclo}</td>
            <td><span class="badge ${st.cls}">${st.label}</span></td>
            <td>
              <button class="action-btn" onclick="openEdit(${g.id})" title="Editar">✏️</button>
              ${g.estado === "Pagado"
                ? `<button class="action-btn" onclick="marcarPendiente(${g.id})" title="Desmarcar">↩️</button>`
                : `<button class="action-btn" onclick="marcarPagado(${g.id})" title="Marcar pagado">✅</button>`
              }
              <button class="action-btn del" onclick="softDelete(${g.id})" title="Eliminar">🗑️</button>
            </td>
          </tr>`;
        }).join("");

    document.getElementById("pag-info").textContent = `Página ${paginaActual} de ${total}`;
    document.getElementById("pag-num").textContent  = `${paginaActual} de ${total}`;
    document.getElementById("btn-prev").disabled    = paginaActual === 1;
    document.getElementById("btn-next").disabled    = paginaActual === total;
  }

  // ── Cargar desde backend ──
  async function cargarGastos() {
    try {
      const lista = await GastosAPI.listar({ activo: true });
      renderGastos(lista);
    } catch (err) {
      showToast("❌ Error cargando gastos: " + err.message);
    }
  }

  // ── Filtros completos ──
  // Recoge valores de AMBAS barras de búsqueda (topbar + toolbar)
  // y los tres filtros desplegables (categoría, estado)
  async function filterGastos() {
    // Barra del topbar (#search) y barra del toolbar (#search2)
    // Se usa el que tenga valor; si ambos tienen, se prioriza search2
    const textoTopbar  = (document.getElementById("search")?.value  || "").trim();
    const textoToolbar = (document.getElementById("search2")?.value || "").trim();
    const nombre    = textoToolbar || textoTopbar || undefined;

    const categoria = document.getElementById("filter-cat")?.value    || undefined;
    const estado    = document.getElementById("filter-status")?.value || undefined;

    try {
      const lista = await GastosAPI.listar({
        activo:    true,
        nombre:    nombre    || undefined,
        categoria: categoria || undefined,
        estado:    estado    || undefined
      });
      paginaActual = 1;
      renderGastos(lista);
    } catch (err) {
      showToast("❌ " + err.message);
    }
  }

  function changePage(dir) {
    const total = Math.max(1, Math.ceil(listaActual.length / POR_PAGINA));
    paginaActual = Math.min(Math.max(1, paginaActual + dir), total);
    renderGastos();
  }

  // ── Agregar gasto ──
  async function addGasto() {
    const nombre = document.getElementById("new-nombre");
    const monto  = document.getElementById("new-monto");
    const fecha  = document.getElementById("new-fecha");

    let ok = true;
    [["ff-nombre", !nombre.value.trim()],
     ["ff-monto",  !monto.value || Number(monto.value) <= 0],
     ["ff-fecha",  !fecha.value]
    ].forEach(([id, cond]) => {
      document.getElementById(id)?.classList.toggle("error", cond);
      if (cond) ok = false;
    });
    if (!ok) return;

    try {
      await GastosAPI.crear({
        nombre:    nombre.value.trim(),
        categoria: document.getElementById("new-categoria").value || "Otro",
        monto:     Number(monto.value),
        fecha:     fecha.value,
        ciclo:     document.getElementById("new-ciclo").value,
        color:     document.getElementById("new-color").value,
        estado:    "Pendiente"
      });

      nombre.value = ""; monto.value = ""; fecha.value = "";
      ["ff-nombre","ff-monto","ff-fecha"].forEach(id =>
        document.getElementById(id)?.classList.remove("error")
      );

      closeModal("modal-nuevo");
      await cargarGastos();
      showToast("Gasto agregado ✓");
    } catch (err) {
      showToast("❌ " + err.message);
    }
  }

  // ── Editar ──
  async function openEdit(id) {
    editingId = id;
    const g = listaActual.find(x => x.id === id);
    if (!g) return;

    document.getElementById("edit-nombre").value    = g.nombre;
    document.getElementById("edit-categoria").value = g.categoria;
    document.getElementById("edit-monto").value     = g.monto;
    document.getElementById("edit-fecha").value     = g.fecha;
    document.getElementById("edit-ciclo").value     = g.ciclo;
    document.getElementById("edit-color").value     = g.color;

    openModal("modal-editar");
  }

  async function saveEdit() {
    try {
      await GastosAPI.editar(editingId, {
        nombre:    document.getElementById("edit-nombre").value,
        categoria: document.getElementById("edit-categoria").value,
        monto:     Number(document.getElementById("edit-monto").value),
        fecha:     document.getElementById("edit-fecha").value,
        ciclo:     document.getElementById("edit-ciclo").value,
        color:     document.getElementById("edit-color").value
      });
      closeModal("modal-editar");
      await cargarGastos();
      showToast("Gasto actualizado ✓");
    } catch (err) {
      showToast("❌ " + err.message);
    }
  }

  // ── Soft delete ──
  async function softDelete(id) {
    if (!confirm("¿Seguro que deseas eliminar este gasto?")) return;
    try {
      await GastosAPI.eliminar(id ?? editingId);
      closeModal("modal-editar");
      await cargarGastos();
      showToast("Gasto eliminado ✓");
    } catch (err) {
      showToast("❌ " + err.message);
    }
  }

  // ── Marcar pagado / pendiente ──
  async function marcarPagado(id) {
    try {
      await GastosAPI.marcarEstado(id, "Pagado");
      await cargarGastos();
      showToast("Gasto marcado como pagado ✓");
    } catch (err) {
      showToast("❌ " + err.message);
    }
  }

  async function marcarPendiente(id) {
    try {
      await GastosAPI.marcarEstado(id, "Pendiente");
      await cargarGastos();
      showToast("Gasto marcado como pendiente ✓");
    } catch (err) {
      showToast("❌ " + err.message);
    }
  }

  // ── Exponer funciones globales ──
  window.addGasto        = addGasto;
  window.openEdit        = openEdit;
  window.saveEdit        = saveEdit;
  window.softDelete      = softDelete;
  window.marcarPagado    = marcarPagado;
  window.marcarPendiente = marcarPendiente;
  window.filterGastos    = filterGastos;
  window.changePage      = changePage;

  document.addEventListener("DOMContentLoaded", () => {
    cargarGastos();

    // Conectar la barra de búsqueda del topbar también al filtro
    const searchTopbar = document.getElementById("search");
    if (searchTopbar) {
      searchTopbar.addEventListener("input", filterGastos);
    }
  });

})();