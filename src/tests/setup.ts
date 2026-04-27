import "@testing-library/jest-dom";
import { vi } from "vitest";

vi.stubEnv("VITE_OPENWEATHER_API_KEY", "test-key");

Object.defineProperty(globalThis, "fetch", {
  value: vi.fn(),
  writable: true,
});