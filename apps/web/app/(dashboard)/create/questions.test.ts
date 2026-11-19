import { IntakeAnswer } from "@nosweat/schema";
import { describe, expect, it } from "vitest";
import { answersFrom, kindForQuestions, questionsFor } from "./questions";

describe("kindForQuestions", () => {
  it("uses the chosen type, and otherwise guesses from the words", () => {
    expect(kindForQuestions("restaurant", "Hair salon in Miami")).toBe("restaurant");
    expect(kindForQuestions("auto", "Hair salon in Miami, FL")).toBe("beauty");
    expect(kindForQuestions("auto", "Family-owned plumbing in Denver")).toBe("home-services");
    expect(kindForQuestions("auto", "Neighborhood taqueria in San Antonio")).toBe("restaurant");
    expect(kindForQuestions("auto", "Immigration law office in Queens")).toBe("professional");
    expect(kindForQuestions("auto", "Wedding photographer in Austin")).toBe("portfolio");
    expect(kindForQuestions("auto", "We do something special")).toBeNull();
  });
});

describe("questionsFor", () => {
  it("keeps every kind to a short, easy list with unique ids", () => {
    for (const kind of ["beauty", "home-services", "restaurant", "professional", "portfolio"] as const) {
      const questions = questionsFor(kind);
      expect(questions.length).toBeGreaterThanOrEqual(4);
      expect(questions.length).toBeLessThanOrEqual(8);
      expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length);
      for (const question of questions) {
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        expect(question.text.endsWith("?")).toBe(true);
      }
    }
    expect(questionsFor(null).map((q) => q.id)).toEqual(["hours", "reach", "pay"]);
  });
});

describe("answersFrom", () => {
  const questions = questionsFor("beauty");

  it("sends only what the owner picked or typed", () => {
    const answers = answersFrom(questions, {
      picks: { appointments: ["Both"], pay: ["At my business (card or cash)", "Online with my own payment link"] },
      others: { hours: "  Mon–Fri   8 AM – 12 PM  " },
    });
    expect(answers).toEqual([
      { question: "Do customers book ahead or walk in?", answer: "Both" },
      { question: "When are you open?", answer: "Mon–Fri 8 AM – 12 PM" },
      {
        question: "How do customers pay you?",
        answer: "At my business (card or cash), Online with my own payment link",
      },
    ]);
    for (const answer of answers) expect(IntakeAnswer.safeParse(answer).success).toBe(true);
  });

  it("ignores options that are not on the list and sends nothing when nothing is picked", () => {
    expect(answersFrom(questions, { picks: { appointments: ["Made up"] }, others: {} })).toEqual([]);
    expect(answersFrom(questions, { picks: {}, others: {} })).toEqual([]);
  });
});
