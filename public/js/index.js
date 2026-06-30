// MOBILE BURGER PANEL
function toggleBurger() {
  const panel = document.getElementById("burger-panel");
  panel.style.display = panel.style.display === "block" ? "none" : "block";
}

// LOGO MENU (FULL SCREEN)
function toggleLogoMenu() {
  const menu = document.getElementById("logo-menu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

// DROPDOWN PANELS
function toggleDropdown(id) {
  const panel = document.getElementById(id);
  const isOpen = panel.style.display === "block";

  document.querySelectorAll(".dropdown-panel").forEach(p => {
    p.style.display = "none";
  });

  panel.style.display = isOpen ? "none" : "block";
}

// CLOSE DROPDOWNS ON MOBILE WHEN SCROLLING
window.addEventListener("scroll", () => {
  document.querySelectorAll(".dropdown-panel").forEach(p => p.style.display = "none");
});

// CLOSE MENUS WHEN CLICKING OUTSIDE
document.addEventListener("click", (e) => {
  const logoMenu = document.getElementById("logo-menu");
  const burgerPanel = document.getElementById("burger-panel");

  if (!e.target.closest(".logo") && !e.target.closest("#logo-menu")) {
    logoMenu.style.display = "none";
  }

  if (!e.target.closest(".burger") && !e.target.closest("#burger-panel")) {
    burgerPanel.style.display = "none";
  }
});
