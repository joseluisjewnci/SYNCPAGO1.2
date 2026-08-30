// auth.js
// localStorage se usa SOLO para: token JWT y datos básicos del usuario.
// La validación real del token se hace contra el backend.

async function login(email, password) {
  try {
    const data = await AuthAPI.login(email, password);

    if (!data.success) { alert(data.mensaje); return; }

    const usuario = data.usuario || {};
    localStorage.setItem("token", data.token);
    localStorage.setItem("user",  JSON.stringify(usuario));

    // Sin admin — todos van al dashboard
    window.location.href = "dashboard.html";

  } catch (err) {
    alert("Error al iniciar sesión: " + err.message);
  }
}

async function register(name, email, phone, password) {
  try {
    const data = await AuthAPI.register(name, email, phone, password);
    alert(data.mensaje || "Cuenta creada exitosamente.");
    if (data.success) window.location.href = "index.html";
  } catch (err) {
    alert("Error al registrarse: " + err.message);
  }
}

async function forgotPassword(email) {
  try {
    await AuthAPI.forgotPassword(email);
  } catch (err) {
    console.error("Error al recuperar contraseña:", err.message);
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

// Verifica el token contra el backend en cada carga de página.
// Si es inválido o expiró, handleResponse() en api.js redirige a index.html.
async function requireAuth() {
  const token = localStorage.getItem("token");
  if (!token) { window.location.href = "index.html"; return; }

  try {
    const usuario = await AuthAPI.me();
    localStorage.setItem("user", JSON.stringify(usuario));
    _poblarDOM(usuario);
  } catch (err) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  }
}

function _poblarDOM(user) {
  const nombre = user.nombre || user.name  || "Usuario";
  const correo = user.correo || user.email || "";
  const ids = {
    "username-display": nombre,
    "welcome-name":     nombre.split(" ")[0],
    "fullname-display": nombre,
    "email-display":    correo
  };
  Object.entries(ids).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  });
}

function handleForgot() {
  const email = document.getElementById("email");
  const fg    = document.getElementById("fg-email");

  if (!email.value.includes("@")) {
    fg.classList.add("error");
    return;
  }
  fg.classList.remove("error");

  forgotPassword(email.value);
  document.getElementById("success-msg").classList.remove("hidden");

  document.querySelector(".btn-primary").disabled    = true;
  document.querySelector(".btn-primary").textContent = "Enlace enviado";
}