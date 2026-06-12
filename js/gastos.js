
(function () {

  let gastos            = JSON.parse(localStorage.getItem("gastos") || "[]");
  let paginaActual      = 1;
  const POR_PAGINA      = 8;
  let editingId         = null;

  function guardarGastos() {
    localStorage.setItem("gastos", JSON.stringify(gastos));
  }


  function getStatus(g) {
    if (g.estado === "Pagado") return { label: "Pagado", cls: "badge-green" };
    const hoy  = new Date();
    const fecha = new Date(g.fecha + "T12:00:00");
    const diff  = Math.ceil((fecha - hoy) / 86400000);
    if (diff < 0)  return { label: "Vencido",  cls: "badge-red" };
    if (diff === 0) return { label: "Hoy",      cls: "badge-today" };
    return { label: "Pendiente", cls: "badge-yellow" };
  }

  function fmtFecha(f) {
    return new Date(f + "T12:00:00").toLocaleDateString("es-CO", {
      day: "2-digit", month: "short", year: "numeric"
    });
  }

  function renderGastos(lista) {
    lista = lista ?? gastos.filter(g => g.activo);

    const tbody = document.getElementById("gastos-tbody");
    if (!tbody) return;

    const total = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    if (paginaActual > total) paginaActual = total;

    const inicio  = (paginaActual - 1) * POR_PAGINA;
    const pagina  = lista.slice(inicio, inicio + POR_PAGINA);

    tbody.innerHTML = pagina.length === 0
      ? `<tr><td colspan="7" style="text-align:center;padding:28px;color:var(--gray-400)">Sin recibos registrados</td></tr>`
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


  function filterGastos() {
    const texto     = (document.getElementById("search2")?.value || "").toLowerCase();
    const categoria = document.getElementById("filter-cat")?.value  || "";
    const estado    = document.getElementById("filter-status")?.value || "";

    let lista = gastos.filter(g => g.activo);
    if (texto)     lista = lista.filter(g => g.nombre.toLowerCase().includes(texto));
    if (categoria) lista = lista.filter(g => g.categoria === categoria);
    if (estado)    lista = lista.filter(g => getStatus(g).label === estado);

    paginaActual = 1;
    renderGastos(lista);
  }


  function changePage(dir) {
    const total = Math.max(1, Math.ceil(gastos.filter(g => g.activo).length / POR_PAGINA));
    paginaActual = Math.min(Math.max(1, paginaActual + dir), total);
    renderGastos();
  }


  function addGasto() {
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

    gastos.unshift({
      id:        Date.now(),
      nombre:    nombre.value.trim(),
      categoria: document.getElementById("new-categoria").value || "Otro",
      monto:     Number(monto.value),
      fecha:     fecha.value,
      ciclo:     document.getElementById("new-ciclo").value,
      color:     document.getElementById("new-color").value,
      estado:    "Pendiente",
      activo:    true
    });

    guardarGastos();
    renderGastos();
    closeModal("modal-nuevo");

    nombre.value = "";
    monto.value  = "";
    fecha.value  = "";
    ["ff-nombre","ff-monto","ff-fecha"].forEach(id =>
      document.getElementById(id)?.classList.remove("error")
    );

    showToast("Recibo agregado ✓");
  }


  function openEdit(id) {
    editingId = id;
    const g = gastos.find(x => x.id === id);
    if (!g) return;

    document.getElementById("edit-nombre").value    = g.nombre;
    document.getElementById("edit-categoria").value = g.categoria;
    document.getElementById("edit-monto").value     = g.monto;
    document.getElementById("edit-fecha").value     = g.fecha;
    document.getElementById("edit-ciclo").value     = g.ciclo;
    document.getElementById("edit-color").value     = g.color;

    openModal("modal-editar");
  }

  function saveEdit() {
    const g = gastos.find(x => x.id === editingId);
    if (!g) return;

    g.nombre    = document.getElementById("edit-nombre").value;
    g.categoria = document.getElementById("edit-categoria").value;
    g.monto     = Number(document.getElementById("edit-monto").value);
    g.fecha     = document.getElementById("edit-fecha").value;
    g.ciclo     = document.getElementById("edit-ciclo").value;
    g.color     = document.getElementById("edit-color").value;

    guardarGastos();
    renderGastos();
    closeModal("modal-editar");
    showToast("Recibo actualizado ✓");
  }


  function softDelete(id) {
    if (!confirm("¿Seguro que deseas eliminar este recibo?")) return;
    const g = gastos.find(x => x.id === (id ?? editingId));
    if (!g) return;

    g.activo = false;
    guardarGastos();
    renderGastos();
    closeModal("modal-editar");
    showToast("Recibo eliminado ✓");
  }


  function marcarPagado(id) {
    const g = gastos.find(x => x.id === id);
    if (!g) return;
    g.estado = "Pagado";
    guardarGastos();
    renderGastos();
    showToast("Recibo marcado como pagado ✓");
  }

  function marcarPendiente(id) {
    const g = gastos.find(x => x.id === id);
    if (!g) return;
    g.estado = "Pendiente";
    guardarGastos();
    renderGastos();
    showToast("Recibo marcado como pendiente ✓");
  }


  window.addGasto       = addGasto;
  window.openEdit       = openEdit;
  window.saveEdit       = saveEdit;
  window.softDelete     = softDelete;
  window.marcarPagado   = marcarPagado;
  window.marcarPendiente = marcarPendiente;
  window.filterGastos   = filterGastos;
  window.changePage     = changePage;


  document.addEventListener("DOMContentLoaded", () => renderGastos());

})();
