const blocks = document.querySelectorAll(".code-wrap");
const header = document.querySelector("#site-header");
const menuButton = document.querySelector(".mobile-menu-button");
const mobileNav = document.querySelector("#mobile-nav");

const updateHeader = () => {
  header?.classList.toggle("site-header-scrolled", window.scrollY > 12);
};

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  menuButton.setAttribute("aria-label", isOpen ? "Открыть меню" : "Закрыть меню");
  mobileNav?.classList.toggle("is-open", !isOpen);
});

mobileNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton?.setAttribute("aria-expanded", "false");
    menuButton?.setAttribute("aria-label", "Открыть меню");
    mobileNav.classList.remove("is-open");
  });
});

for (const block of blocks) {
  const pre = block.querySelector("pre");
  if (!pre) continue;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-button";
  button.textContent = "Скопировать";

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(pre.innerText.trim());
      const previous = button.textContent;
      button.textContent = "Готово";
      window.setTimeout(() => {
        button.textContent = previous ?? "Скопировать";
      }, 1600);
    } catch {
      button.textContent = "Ошибка";
      window.setTimeout(() => {
        button.textContent = "Скопировать";
      }, 1600);
    }
  });

  block.appendChild(button);
}
