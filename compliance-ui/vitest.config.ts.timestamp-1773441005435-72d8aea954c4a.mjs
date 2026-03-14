// vitest.config.ts
import { defineConfig } from "file:///D:/Workspace/Github/unionhall_compliance/compliance-ui/node_modules/vitest/dist/config.js";
import react from "file:///D:/Workspace/Github/unionhall_compliance/compliance-ui/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "D:\\Workspace\\Github\\unionhall_compliance\\compliance-ui";
var vitest_config_default = defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    exclude: ["node_modules", "dist", "server", "**/*.node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "server/",
        "src/setupTests.ts",
        "src/main.tsx",
        "**/*.d.ts"
      ],
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70
    },
    silent: false
  },
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
});
export {
  vitest_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZXN0LmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXFdvcmtzcGFjZVxcXFxHaXRodWJcXFxcdW5pb25oYWxsX2NvbXBsaWFuY2VcXFxcY29tcGxpYW5jZS11aVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcV29ya3NwYWNlXFxcXEdpdGh1YlxcXFx1bmlvbmhhbGxfY29tcGxpYW5jZVxcXFxjb21wbGlhbmNlLXVpXFxcXHZpdGVzdC5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L1dvcmtzcGFjZS9HaXRodWIvdW5pb25oYWxsX2NvbXBsaWFuY2UvY29tcGxpYW5jZS11aS92aXRlc3QuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZyc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICAgIHBsdWdpbnM6IFtyZWFjdCgpXSxcclxuICAgIHRlc3Q6IHtcclxuICAgICAgICBnbG9iYWxzOiB0cnVlLFxyXG4gICAgICAgIGVudmlyb25tZW50OiAnanNkb20nLFxyXG4gICAgICAgIHNldHVwRmlsZXM6IFsnLi9zcmMvc2V0dXBUZXN0cy50cyddLFxyXG4gICAgICAgIGV4Y2x1ZGU6IFsnbm9kZV9tb2R1bGVzJywgJ2Rpc3QnLCAnc2VydmVyJywgJyoqLyoubm9kZV9tb2R1bGVzLyoqJ10sXHJcbiAgICAgICAgY292ZXJhZ2U6IHtcclxuICAgICAgICAgICAgcHJvdmlkZXI6ICd2OCcsXHJcbiAgICAgICAgICAgIHJlcG9ydGVyOiBbJ3RleHQnLCAnanNvbicsICdodG1sJ10sXHJcbiAgICAgICAgICAgIGV4Y2x1ZGU6IFtcclxuICAgICAgICAgICAgICAgICdub2RlX21vZHVsZXMvJyxcclxuICAgICAgICAgICAgICAgICdkaXN0LycsXHJcbiAgICAgICAgICAgICAgICAnc2VydmVyLycsXHJcbiAgICAgICAgICAgICAgICAnc3JjL3NldHVwVGVzdHMudHMnLFxyXG4gICAgICAgICAgICAgICAgJ3NyYy9tYWluLnRzeCcsXHJcbiAgICAgICAgICAgICAgICAnKiovKi5kLnRzJyxcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgbGluZXM6IDcwLFxyXG4gICAgICAgICAgICBmdW5jdGlvbnM6IDcwLFxyXG4gICAgICAgICAgICBicmFuY2hlczogNzAsXHJcbiAgICAgICAgICAgIHN0YXRlbWVudHM6IDcwLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2lsZW50OiBmYWxzZSxcclxuICAgIH0sXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgICAgYWxpYXM6IHtcclxuICAgICAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgICAgICB9LFxyXG4gICAgfSxcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBa1csU0FBUyxvQkFBb0I7QUFDL1gsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHdCQUFRLGFBQWE7QUFBQSxFQUN4QixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsTUFBTTtBQUFBLElBQ0YsU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsWUFBWSxDQUFDLHFCQUFxQjtBQUFBLElBQ2xDLFNBQVMsQ0FBQyxnQkFBZ0IsUUFBUSxVQUFVLHNCQUFzQjtBQUFBLElBQ2xFLFVBQVU7QUFBQSxNQUNOLFVBQVU7QUFBQSxNQUNWLFVBQVUsQ0FBQyxRQUFRLFFBQVEsTUFBTTtBQUFBLE1BQ2pDLFNBQVM7QUFBQSxRQUNMO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxNQUNKO0FBQUEsTUFDQSxPQUFPO0FBQUEsTUFDUCxXQUFXO0FBQUEsTUFDWCxVQUFVO0FBQUEsTUFDVixZQUFZO0FBQUEsSUFDaEI7QUFBQSxJQUNBLFFBQVE7QUFBQSxFQUNaO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDTCxPQUFPO0FBQUEsTUFDSCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDeEM7QUFBQSxFQUNKO0FBQ0osQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
