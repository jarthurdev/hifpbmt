import { initializeAdminView } from "./views/admin-view.js";
import { showToast } from "./ui/toast.js";

initializeAdminView().catch(error => {
  console.error("Could not initialize admin view:", error);
  showToast(error.message);
});
