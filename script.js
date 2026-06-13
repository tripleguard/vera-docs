const blocks = document.querySelectorAll(".code-wrap");

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
