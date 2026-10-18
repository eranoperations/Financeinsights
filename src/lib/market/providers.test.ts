import { describe, expect, it, vi } from "vitest";
import { PROVIDERS, resolveProvider } from "./providers";

describe("resolveProvider", () => {
  it("defaults to yahoo", () => {
    expect(resolveProvider(undefined).name).toBe("yahoo");
    expect(resolveProvider("").name).toBe("yahoo");
  });

  it("picks a registered provider by name, case-insensitively", () => {
    expect(resolveProvider("mock")).toBe(PROVIDERS.mock);
    expect(resolveProvider(" MOCK ")).toBe(PROVIDERS.mock);
  });

  it("falls back to the default for unknown names", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(resolveProvider("nope").name).toBe("yahoo");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
