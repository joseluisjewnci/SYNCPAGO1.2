// dashboard.js — Adaptado al backend real

// Badge de recordatorios: usa el backend, no localStorage
async function actualizarBadgeRecordatorios() {
  try {
    const hoy    = new Date();
    const gastos = await GastosAPI.listar({ activo: true });
    const proximos = gastos.filter(g => {
      if (g.estado === "Pagado") return false;
      const diff = Math.ceil((new Date(g.fecha + "T12:00:00") - hoy) / 86400000);
      return diff >= 0 && diff <= 3;
    }).length;
    const badge = document.getElementById("badge-rec");
    if (badge) badge.textContent = proximos;
  } catch (err) {
    console.error("Error actualizando badge:", err.message);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const hoy    = new Date();
    const gastos = await GastosAPI.listar({ activo: true });

    const delMes = gastos.filter(g => {
      const f = new Date(g.fecha + "T12:00:00");
      return f.getMonth()    === hoy.getMonth()
          && f.getFullYear() === hoy.getFullYear();
    });

    const total      = delMes.reduce((a, g) => a + g.monto, 0);
    const pagados    = delMes.filter(g => g.estado === "Pagado").length;
    const vencidos   = delMes.filter(g => {
      if (g.estado === "Pagado") return false;
      return new Date(g.fecha + "T12:00:00") < hoy;
    }).length;
    const pendientes = delMes.length - pagados - vencidos;

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    set("kpi-total",   formatMoney(total));
    set("kpi-paid",    pagados);
    set("kpi-pending", pendientes);
    set("kpi-overdue", vencidos);

    await actualizarBadgeRecordatorios();

  } catch (err) {
    console.error("Error cargando dashboard:", err.message);
  }
});

requireAuth();

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("overlay").classList.toggle("open");
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("open");
}
function toggleDropdown() {
  const dd = document.getElementById("user-dropdown");
  dd.classList.toggle("open");
}
document.addEventListener("click", e => {
  const menu = document.querySelector(".user-menu");
  const dd   = document.getElementById("user-dropdown");
  if (dd && menu && !menu.contains(e.target)) dd.classList.remove("open");
});