export function initializeModals(root = document) {
  const close = modal => {
    modal.hidden = true;
    modal.style.display = "none";
  };

  root.querySelectorAll(".modal-backdrop, .modal-backdrop[role='dialog']").forEach(modal => {
    modal.hidden = true;
    modal.style.display = "none";
    modal.querySelectorAll("[data-modal-close], .modal-close-btn").forEach(button => {
      button.addEventListener("click", () => close(modal));
    });
    modal.addEventListener("click", event => {
      if (event.target === modal) close(modal);
    });
  });

  root.addEventListener("click", event => {
    const opener = event.target.closest("[data-open-modal]");
    if (!opener) return;
    const modal = root.getElementById(opener.dataset.openModal);
    if (!modal) return;
    modal.hidden = false;
    modal.style.display = "flex";
    modal.querySelector("input, select, textarea, button")?.focus();
  });

  root.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    root.querySelectorAll(".modal-backdrop:not([hidden])").forEach(close);
  });

  return {
    open(id) {
      const modal = root.getElementById(id);
      if (!modal) return;
      modal.hidden = false;
      modal.style.display = "flex";
    },
    close(id) {
      const modal = root.getElementById(id);
      if (modal) close(modal);
    }
  };
}
