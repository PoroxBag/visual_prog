import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

function coverApi(): Plugin {
  return {
    name: "cover-api",
    configureServer(server) {
      server.middlewares.use("/api/cover", async (req, res, next) => {
        const url = new URL(req.url ?? "", "http://localhost");
        const isbn = url.searchParams.get("isbn")?.trim();
        const title = url.searchParams.get("title")?.trim();

        if (!isbn && !title) return next();

        try {
          const q = isbn ? `isbn:${isbn}` : `intitle:${title}`;
          const api = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}`
          );
          const data: any = await api.json();

          const imgUrl =
            data?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail ??
            data?.items?.[0]?.volumeInfo?.imageLinks?.smallThumbnail;

          if (!imgUrl) {
            res.statusCode = 404;
            res.end();
            return;
          }

          const img = await fetch(String(imgUrl).replace(/^http:\/\//, "https://"));
          if (!img.ok) {
            res.statusCode = img.status;
            res.end();
            return;
          }

          res.setHeader("Content-Type", img.headers.get("content-type") ?? "image/jpeg");
          res.end(Buffer.from(await img.arrayBuffer()));
        } catch {
          res.statusCode = 500;
          res.end();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), coverApi()],
});