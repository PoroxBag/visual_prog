import "@testing-library/jest-dom";
import { vi } from "vitest";

Object.defineProperty(globalThis, "fetch", {
  value: vi.fn(),
  writable: true,
});