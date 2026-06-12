
(function () {

  let historial    = JSON.parse(localStorage.getItem("gastos") || "[]");
  let paginaActual = 1;
  const POR_PAGINA = 8;

  function fmtFecha(str) {
    return new Date(str + "T12:00:00").toLocaleDateString("es-CO", {
      day: "2-digit", month: "short", year: "numeric"
    });
  }

  function getEstado(g) {
    if (!g.activo) return { texto: "Eliminado", clase: "" };
    if (g.estado === "Pagado") return { texto: "Pagado", clase: "badge-green" };

    const hoy  = new Date();
    const fecha = new Date(g.fecha + "T12:00:00");
    const diff  = Math.ceil((fecha - hoy) / 86400000);

    if (diff < 0)   return { texto: "Vencido",  clase: "badge-red" };
    if (diff === 0) return { texto: "Hoy",       clase: "badge-today" };
    return { texto: "Pendiente", clase: "badge-yellow" };
  }

  function renderHistorial(lista) {
    lista = lista ?? historial;

    const total = Math.max(1, Math.ceil(lista.length / POR_PAGINA));
    if (paginaActual > total) paginaActual = total;

    const inicio = (paginaActual - 1) * POR_PAGINA;
    const pagina = lista.slice(inicio, inicio + POR_PAGINA);

    const tbody = document.getElementById("hist-tbody");
    if (!tbody) return;

    tbody.innerHTML = pagina.length === 0
      ? `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--gray-400)">No hay registros</td></tr>`
      : pagina.map(g => {
          const estado = getEstado(g);
          return `
          <tr ${!g.activo ? 'style="opacity:.6"' : ''}>
            <td><span class="service-cell">
              <span class="color-dot" style="background:${g.color}"></span>
              ${g.nombre}
            </span></td>
            <td>${g.categoria}</td>
            <td>${formatMoney(g.monto)}</td>
            <td>${fmtFecha(g.fecha)}</td>
            <td>${
              estado.texto === "Eliminado"
                ? `<span class="badge" style="background:#f1f5f9;color:#64748b">Eliminado</span>`
                : `<span class="badge ${estado.clase}">${estado.texto}</span>`
            }</td>
          </tr>`;
        }).join("");

    document.getElementById("hist-pag-info").textContent = `Página ${paginaActual} de ${total}`;
    document.getElementById("hist-pag-num").textContent  = `${paginaActual} de ${total}`;
    document.getElementById("hist-prev").disabled        = paginaActual === 1;
    document.getElementById("hist-next").disabled        = paginaActual === total;
  }

  function changeHistPage(dir) {
    const total = Math.max(1, Math.ceil(historial.length / POR_PAGINA));
    paginaActual = Math.min(Math.max(1, paginaActual + dir), total);
    renderHistorial();
  }

  function filterHistorial() {
    const texto     = (document.getElementById("hist-q")?.value     || "").toLowerCase();
    const categoria =  document.getElementById("hist-cat")?.value   || "";
    const estado    =  document.getElementById("hist-status")?.value || "";
    const desde     =  document.getElementById("hist-from")?.value  || "";
    const hasta     =  document.getElementById("hist-to")?.value    || "";

    let lista = [...historial];

    if (texto)     lista = lista.filter(g => g.nombre.toLowerCase().includes(texto));
    if (categoria) lista = lista.filter(g => g.categoria === categoria);
    if (estado)    lista = lista.filter(g => getEstado(g).texto === estado);
    if (desde)     lista = lista.filter(g => g.fecha >= desde);
    if (hasta)     lista = lista.filter(g => g.fecha <= hasta);

    paginaActual = 1;
    renderHistorial(lista);
  }

  window.filterHistorial = filterHistorial;

  document.addEventListener("DOMContentLoaded", () => {
    renderHistorial();
    document.getElementById("hist-prev")?.addEventListener("click", () => changeHistPage(-1));
    document.getElementById("hist-next")?.addEventListener("click", () => changeHistPage(1));
  });

})();
