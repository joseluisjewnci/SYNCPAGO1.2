// api.js — Capa central de comunicación con el backend FastAPI
// Cárgalo PRIMERO en todos los HTML antes que cualquier otro JS

const API_URL = "http://127.0.0.1:8000";

// ── Token ──
function getToken() {
  return localStorage.getItem("token");
}

function authHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getToken()}`
  };
}

// ── Manejo central de respuestas y errores ──
async function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
    return;
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || data.mensaje || "Error del servidor");
  return data;
}

// ══════════════════════════════
// AUTH
// ══════════════════════════════
const AuthAPI = {
  async login(correo, password) {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, password })
    });
    return handleResponse(res);
  },

  async register(nombre, correo, celular, password) {
    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, correo, celular, password })
    });
    return handleResponse(res);
  },

  async forgotPassword(correo) {
    const res = await fetch(`${API_URL}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo })
    });
    return handleResponse(res);
  },

  // Valida el token contra el backend y devuelve el usuario real.
  async me() {
    const res = await fetch(`${API_URL}/me`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  }
};

// ══════════════════════════════
// GASTOS
// ══════════════════════════════
const GastosAPI = {
  async listar(params = {}) {
    const q = new URLSearchParams();
    if (params.nombre    !== undefined) q.append("nombre",    params.nombre);
    if (params.categoria !== undefined) q.append("categoria", params.categoria);
    if (params.estado    !== undefined) q.append("estado",    params.estado);
    if (params.activo    !== undefined) q.append("activo",    params.activo);

    const res = await fetch(`${API_URL}/gastos?${q}`, { headers: authHeaders() });
    return handleResponse(res);
  },

  async crear(datos) {
    const res = await fetch(`${API_URL}/gastos`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(datos)
    });
    return handleResponse(res);
  },

  async editar(id, datos) {
    const res = await fetch(`${API_URL}/gastos/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(datos)
    });
    return handleResponse(res);
  },

  async eliminar(id) {
    const res = await fetch(`${API_URL}/gastos/${id}`, {
      method: "DELETE",
      headers: authHeaders()
    });
    return handleResponse(res);
  },

  async marcarEstado(id, estado) {
    const res = await fetch(`${API_URL}/gastos/${id}/estado`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ estado })
    });
    return handleResponse(res);
  }
};

// ══════════════════════════════
// RECORDATORIOS
// ══════════════════════════════
const RecordatoriosAPI = {
  async obtener() {
    const res = await fetch(`${API_URL}/recordatorios`, { headers: authHeaders() });
    return handleResponse(res);
  },

  async guardar(datos) {
    const res = await fetch(`${API_URL}/recordatorios`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(datos)
    });
    return handleResponse(res);
  }
};

// ══════════════════════════════
// FINANZAS (presupuesto mensual)
// ══════════════════════════════
const FinanzasAPI = {
  // Cuando el backend esté listo, estos métodos reemplazarán el localStorage
  // que se usa temporalmente en insights.html

  async guardarPresupuesto(monto) {
    const res = await fetch(`${API_URL}/finanzas/presupuesto`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ monto })
    });
    return handleResponse(res);
  },

  async obtenerPresupuesto() {
    const res = await fetch(`${API_URL}/finanzas/presupuesto`, {
      headers: authHeaders()
    });
    return handleResponse(res);
  }
};