import { fileURLToPath } from "node:url";

// Bản build của giao diện React (client/dist), được backend phục vụ khi chạy thật
export const CLIENT_DIST = fileURLToPath(new URL("../../../client/dist", import.meta.url));
export const CLIENT_INDEX = fileURLToPath(new URL("../../../client/dist/index.html", import.meta.url));