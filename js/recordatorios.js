
function guardarPreferencias() {
  const wpRadio  = document.querySelector('input[name="wp"]:checked');
  const calRadio = document.querySelector('input[name="cal"]:checked');
  const antBtn   = document.querySelector(".ant-btn.active");

  const prefs = {
    whatsapp:   wpRadio?.parentElement.textContent.includes("Aceptar")  ?? true,
    calendario: calRadio?.parentElement.textContent.includes("Aceptar") ?? false,
    antelacion: antBtn?.dataset.days ?? "1"
  };

  localStorage.setItem("prefs_recordatorios", JSON.stringify(prefs));
  showToast("Preferencias guardadas ✓");
}

function cargarPreferencias() {
  const prefs = JSON.parse(localStorage.getItem("prefs_recordatorios") || "{}");

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
      btn.classList.toggle("active", btn.dataset.days === prefs.antelacion);
    });
  }

  actualizarColoresRadios();
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

document.addEventListener("DOMContentLoaded", () => {
  cargarPreferencias();

  document.querySelectorAll('input[name="wp"], input[name="cal"]').forEach(r => {
    r.addEventListener("change", () => {
      actualizarColoresRadios();
      guardarPreferencias();
    });
  });

  const sel = document.getElementById("sel-gasto");
  if (sel) {
    const gastos = JSON.parse(localStorage.getItem("gastos") || "[]")
      .filter(g => g.activo);
    sel.innerHTML = `<option value="">Escoja el recibo que desea configurar</option>` +
      gastos.map(g => `<option value="${g.id}">${g.nombre}</option>`).join("");
  }
});

window.selectAnt          = selectAnt;
window.guardarPreferencias = guardarPreferencias;
