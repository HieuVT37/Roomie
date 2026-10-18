import api from "./axios";

export const uploadImagesApi = (files) => {
  const form = new FormData();
  files.forEach((f) => form.append("images", f));
  return api.post("/uploads/images", form).then((r) => r.data);
};