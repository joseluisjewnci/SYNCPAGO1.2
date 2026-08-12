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
  document.getElementById("user-dropdown").classList.toggle("open");
}

function openModal(id) {
  document.getElementById(id).classList.add("open");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}

document.querySelectorAll(".modal-overlay").forEach(o =>
  o.addEventListener("click", e => {
    if (e.target === o) o.classList.remove("open");
  })
);

document.addEventListener("click", e => {
  const menu = document.querySelector(".user-menu");
  const dd = document.getElementById("user-dropdown");

  if (dd && menu && !menu.contains(e.target)) {
    dd.classList.remove("open");
  }
});