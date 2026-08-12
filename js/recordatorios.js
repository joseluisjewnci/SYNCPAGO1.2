// recordatorios.js — Adaptado al backend real

async function guardarPreferencias() {
  const wpRadio  = document.querySelector('input[name="wp"]:checked');
  const calRadio = document.querySelector('input[name="cal"]:checked');
  const antBtn   = document.querySelector(".ant-btn.active");

  const datos = {
    whatsapp:   wpRadio?.parentElement.textContent.includes("Aceptar")  ?? true,
    calendario: calRadio?.parentElement.textContent.includes("Aceptar") ?? false,
    antelacion: antBtn?.dataset.days ?? "1"
  };

  try {
    await RecordatoriosAPI.guardar(datos);
    showToast("Preferencias guardadas ✓");
  } catch (err) {
    showToast("❌ " + err.message);
  }
}

async function cargarPreferencias() {
  try {
    const prefs = await RecordatoriosAPI.obtener();

    if (typeof prefs.whatsapp !== "undefined") {
      document.querySelectorAll('input[name="wp"]').forEach(r => {
        const esAceptar = r.parentElement.textContent.includes("Aceptar");
        r.checked = prefs.whatsapp ? esAceptar : !esAceptar;
      });
    }

    if (typeof prefs.calendario !== "undefined") {
      document.querySelectorAll('input[name="cal"]').forEach(r => {
        const esAceptar = r.parentElement.textContent.includes("Aceptar");
        r.checked = prefs.calendario ? esAceptar : !esAceptar;
      });
    }

    if (prefs.antelacion) {
      document.querySelectorAll(".ant-btn").forEach(btn => {
        btn.classList.toggle("active", btn.dataset.days === String(prefs.antelacion));
      });
    }

    actualizarColoresRadios();
  } catch (err) {
    // Si aún no hay preferencias guardadas, no es error crítico
    console.warn("Sin preferencias previas:", err.message);
  }
}

function actualizarColoresRadios() {
  document.querySelectorAll(".radio-group").forEach(grupo => {
    grupo.querySelectorAll('input[type="radio"]').forEach(radio => {
      const label = radio.parentElement;
      label.classList.remove("sel-green", "sel-red");
      if (radio.checked) {
        label.classList.add(
          label.textContent.includes("Aceptar") ? "sel-green" : "sel-red"
        );
      }
    });
  });
}

function selectAnt(btn, days) {
  document.querySelectorAll(".ant-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  btn.dataset.days = days;
  guardarPreferencias();
  showToast(`Recibirás alertas ${days} día(s) antes del vencimiento ✓`);
}

async function poblarSelectGastos() {
  const sel = document.getElementById("sel-gasto");
  if (!sel) return;
  try {
    const gastos = await GastosAPI.listar({ activo: true });
    sel.innerHTML = `<option value="">Escoja el gasto que desea configurar</option>` +
      gastos.map(g => `<option value="${g.id}">${g.nombre}</option>`).join("");
  } catch (err) {
    console.error("Error cargando gastos en selector:", err.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  cargarPreferencias();
  poblarSelectGastos();

  document.querySelectorAll('input[name="wp"], input[name="cal"]').forEach(r => {
    r.addEventListener("change", () => {
      actualizarColoresRadios();
      guardarPreferencias();
    });
  });
});

window.selectAnt           = selectAnt;
window.guardarPreferencias = guardarPreferencias;