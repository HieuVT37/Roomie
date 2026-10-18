import api from "./axios";

const d = (r) => r.data;

export const listFavoritesApi = (type = "accommodation") => api.get("/favorites", { params: { type } }).then(d);
export const addFavoriteApi = (targetType, targetId) => api.post("/favorites", { targetType, targetId }).then(d);
export const removeFavoriteApi = (targetType, targetId) => api.delete(`/favorites/${targetType}/${targetId}`).then(d);