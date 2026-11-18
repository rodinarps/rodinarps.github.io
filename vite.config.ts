import { defineConfig } from "vitest/config";

/**
 * The game is fully self-contained: scripts, styles and fonts all come from the
 * same origin. This policy makes the browser enforce that, so an accidental CDN
 * link or tracker would be blocked instead of silently loading.
 * It is only added to production builds (the dev server needs inline scripts for hot reload).
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self'",
  "base-uri 'none'",
].join("; ");

export default defineConfig({
  // Relative asset paths: the build works under https://<user>.github.io/<repo>/
  // as well as on a custom domain, without hard-coding the repository name.
  base: "./",
  plugins: [
    {
      name: "inject-content-security-policy",
      apply: "build",
      transformIndexHtml: () => [
        {
          tag: "meta",
          attrs: { "http-equiv": "Content-Security-Policy", content: CONTENT_SECURITY_POLICY },
          injectTo: "head-prepend",
        },
      ],
    },
  ],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
