import { request } from "../api/http-client.js";

export const scheduleService = {
  getSchedules(filters = {}, token) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
    }
    const suffix = query.size ? `?${query.toString()}` : "";
    return request(`schedules${suffix}`, { token });
  },
  create: data => request("schedule-slots", { method: "POST", body: data }),
  update: (id, data) => request(`schedule-slots/${encodeURIComponent(id)}`, { method: "PUT", body: data }),
  remove: id => request(`schedule-slots/${encodeURIComponent(id)}`, { method: "DELETE" }),
  import: data => request("schedules/import", { method: "POST", body: data })
};
