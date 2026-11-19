import { request } from "../api/http-client.js";

function resourceService(path) {
  return {
    create: data => request(path, { method: "POST", body: data }),
    update: (id, data) => request(`${path}/${encodeURIComponent(id)}`, { method: "PUT", body: data }),
    remove: id => request(`${path}/${encodeURIComponent(id)}`, { method: "DELETE" })
  };
}

export const managementService = {
  courses: resourceService("courses"),
  classGroups: resourceService("class-groups"),
  subjects: resourceService("subjects"),
  professors: resourceService("professors"),
  rooms: resourceService("rooms"),
  timeBlocks: resourceService("time-blocks")
};
