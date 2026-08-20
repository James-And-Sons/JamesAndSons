import { describe, it, expect } from "vitest";
import { parseAspectRatioPreset } from "../utils/imageUtils";

describe("Media Package Image Utilities", () => {
  describe("parseAspectRatioPreset", () => {
    it("correctly parses 1:1 square preset", () => {
      expect(parseAspectRatioPreset("1:1")).toBe(1);
    });

    it("correctly parses 4:5 storefront standard portrait preset", () => {
      expect(parseAspectRatioPreset("4:5")).toBe(0.8);
    });

    it("correctly parses 3:4 portrait preset", () => {
      expect(parseAspectRatioPreset("3:4")).toBe(0.75);
    });

    it("correctly parses 16:9 landscape banner preset", () => {
      expect(parseAspectRatioPreset("16:9")).toBeCloseTo(1.7777, 3);
    });

    it("correctly parses 9:16 story preset", () => {
      expect(parseAspectRatioPreset("9:16")).toBeCloseTo(0.5625, 3);
    });

    it("returns null for freeform preset or invalid string", () => {
      expect(parseAspectRatioPreset("free")).toBeNull();
      expect(parseAspectRatioPreset("unknown")).toBeNull();
    });
  });
});
