import { describe, it, expect } from "vitest";
import { genderText, pronoun, friendNoun, GENDER_OPTIONS } from "@/lib/gender";

describe("genderText", () => {
  it("returns masculin for 'homme'", () => {
    expect(genderText("homme", "il", "elle", "iel")).toBe("il");
  });

  it("returns feminin for 'femme'", () => {
    expect(genderText("femme", "il", "elle", "iel")).toBe("elle");
  });

  it("returns neutre for 'autre'", () => {
    expect(genderText("autre", "il", "elle", "iel")).toBe("iel");
  });

  it("returns masculin as fallback when no neutre provided", () => {
    expect(genderText("autre", "il", "elle")).toBe("il");
    expect(genderText(null, "il", "elle")).toBe("il");
    expect(genderText(undefined, "il", "elle")).toBe("il");
  });
});

describe("pronoun", () => {
  it("returns correct pronouns", () => {
    expect(pronoun("homme")).toBe("il");
    expect(pronoun("femme")).toBe("elle");
    expect(pronoun("autre")).toBe("iel");
  });
});

describe("friendNoun", () => {
  it("returns gendered friend noun", () => {
    expect(friendNoun("homme")).toBe("ami");
    expect(friendNoun("femme")).toBe("amie");
    expect(friendNoun("autre")).toBe("ami·e");
  });
});

describe("GENDER_OPTIONS", () => {
  it("has exactly 3 options", () => {
    expect(GENDER_OPTIONS).toHaveLength(3);
  });

  it("each option has value, label, and emoji", () => {
    for (const opt of GENDER_OPTIONS) {
      expect(opt.value).toBeTruthy();
      expect(opt.label).toBeTruthy();
      expect(opt.emoji).toBeTruthy();
    }
  });
});
