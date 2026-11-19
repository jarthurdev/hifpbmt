import { authService } from "./services/auth-service.js";
import { showToast } from "./ui/toast.js";

const form = document.getElementById("adminLoginForm");
const redirectTarget = "admin.html";

if (authService.isAuthenticated()) location.replace(redirectTarget);

form?.addEventListener("submit", async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const submitButton = form.querySelector("button[type='submit']");
  if (submitButton) submitButton.disabled = true;
  try {
    await authService.login(
      document.getElementById("adminLoginEmail").value.trim(),
      document.getElementById("adminLoginPassword").value
    );
    location.replace(redirectTarget);
  } catch (error) {
    showToast(error.message);
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
});
