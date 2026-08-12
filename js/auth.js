// auth.js
// localStorage se usa SOLO para: token JWT, datos básicos del usuario autenticado.
// La validación real del token se hace contra el backend en requireAuth/requireAdmin.

async function login(email, password, rol = "cliente") {
  try {
    const data = await AuthAPI.login(email, password);

    if (!data.success) { alert(data.mensaje); return; }

    const usuario = data.usuario || {};
    localStorage.setItem("token", data.token);
    localStorage.setItem("user",  JSON.stringify(usuario));

    window.location.href = usuario.rol === "administrador"
      ? "admin.html"
      : "dashboard.html";

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

// Verifica el token contra el backend.
// Si el token es inválido o expiró, el backend responde 401
// y handleResponse() en api.js redirige a index.html automáticamente.
async function requireAuth() {
  const token = localStorage.getItem("token");
  if (!token) { window.location.href = "index.html"; return; }

  try {
    // Llama al backend para validar el token y obtener el usuario real
    const usuario = await AuthAPI.me();

    // Actualizar localStorage con los datos frescos del backend
    localStorage.setItem("user", JSON.stringify(usuario));

    if (usuario.rol === "administrador") {
      window.location.href = "admin.html";
      return;
    }

    _poblarDOM(usuario);

  } catch (err) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
  }
}

async function requireAdmin() {
  const token = localStorage.getItem("token");
  if (!token) { window.location.href = "index.html"; return; }

  try {
    const usuario = await AuthAPI.me();

    localStorage.setItem("user", JSON.stringify(usuario));

    if (usuario.rol !== "administrador") {
      alert("Acceso denegado.");
      window.location.href = "index.html";
      return;
    }

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