const API_BASE_URL = "http://localhost:3333/api";

export async function request(path, options = {}) {
  const { token, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);
  headers.set("Accept", "application/json");
  if (fetchOptions.body && typeof fetchOptions.body !== "string" &&
      !(typeof FormData !== "undefined" && fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  }

  const authToken = token !== undefined ? token : (
    typeof sessionStorage === "undefined" ? null : sessionStorage.getItem("hifpb-admin-token")
  );
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);

  let response;
  try {
    response = await fetch(new URL(path.replace(/^\//, ""), `${API_BASE_URL}/`), {
      ...fetchOptions,
      headers
    });
  } catch (error) {
    throw new Error("Não foi possível conectar à API. Verifique se o back-end está ativo.", { cause: error });
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error = new Error(body?.error || `A API respondeu com HTTP ${response.status}.`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export { API_BASE_URL };
