import { describe, expect, it } from "vitest";
import { formatMontant } from "./utils";

describe("formatMontant", () => {
  it("formate un montant avec 3 décimales et le suffixe DT", () => {
    expect(formatMontant(292.5)).toBe("292.500 DT");
  });

  it("gère les montants entiers", () => {
    expect(formatMontant(1)).toBe("1.000 DT");
  });
});
