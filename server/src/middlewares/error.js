export function notFound(req, res) {
  res.status(404).json({ message: `Không tìm thấy ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || "Lỗi máy chủ";

  if (err.name === "ValidationError") status = 422; // lỗi schema Mongoose
  if (err.name === "CastError") {
    status = 400;
    message = "Dữ liệu không hợp lệ";
  }
  if (err.name === "MulterError") {
    status = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Mỗi ảnh tối đa 5MB"
        : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Bạn đã chọn quá số lượng ảnh cho phép"
          : "Không tải được ảnh";
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ message, code: typeof err.code === "string" ? err.code : undefined });
}