import { request } from "../api/http-client.js";

const TOKEN_KEY = "hifpb-admin-token";

export const authService = {
  async login(email, password) {
    const result = await request("auth/login", {
      method: "POST",
      token: null,
      body: { email, password }
    });
    sessionStorage.setItem(TOKEN_KEY, result.token);
    return result.user;
  },

  getToken() {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated() {
    return Boolean(this.getToken());
  },

  logout() {
    sessionStorage.removeItem(TOKEN_KEY);
  }
};
