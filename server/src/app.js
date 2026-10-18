import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import { UPLOAD_DIR } from "./config/paths.js";
import { notFound, errorHandler } from "./middlewares/error.js";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // cho phép hiển thị ảnh upload
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d" }));
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;