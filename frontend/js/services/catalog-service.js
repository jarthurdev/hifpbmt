import { request } from "../api/http-client.js";

function queryString(params) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  }
  const value = query.toString();
  return value ? `?${value}` : "";
}

export const catalogService = {
  getCourses: token => request("courses", { token }),
  getClassGroups: (filters = {}, token) =>
    request(`class-groups${queryString(filters)}`, { token }),
  getSubjects: token => request("subjects", { token }),
  getProfessors: token => request("professors", { token }),
  getRooms: token => request("rooms", { token }),
  getTimeBlocks: token => request("time-blocks", { token }),
  getRoomAvailability: (filters, token) =>
    request(`rooms/availability${queryString(filters)}`, { token })
};
