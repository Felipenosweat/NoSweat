"use client";

import { useId } from "react";
import { focusRing } from "./ui";
import type { Picked, Question } from "./questions";

// Passo "A few quick questions" do assistente do /create: toques em opções (sim/não ou uma
// escolha), tudo opcional. As respostas seguem para a IA como fatos que o dono declarou.

const chipClass =
  "inline-flex min-h-11 cursor-pointer items-center rounded-full border border-slate-200 bg-white px-4 text-[15px] font-medium text-slate-700 transition-colors duration-150 hover:border-slate-300 aria-pressed:border-brand aria-pressed:bg-brand/10 aria-pressed:text-ink motion-reduce:transition-none";

export function QuestionsStep({
  questions,
  picked,
  onChange,
}: {
  questions: readonly Question[];
  picked: Picked;
  onChange: (next: Picked) => void;
}) {
  const ids = useId();

  function toggle(question: Question, option: string) {
    const current = picked.picks[question.id] ?? [];
    const has = current.includes(option);
    const next = question.multi
      ? has
        ? current.filter((item) => item !== option)
        : [...current, option]
      : has
        ? []
        : [option];
    onChange({ ...picked, picks: { ...picked.picks, [question.id]: next } });
  }

  return (
    <div className="space-y-6">
      {questions.map((question, index) => {
        const current = picked.picks[question.id] ?? [];
        return (
          <fieldset key={question.id} className="min-w-0">
            <legend className="text-[15px] font-semibold text-ink">{question.text}</legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {question.options.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={current.includes(option)}
                  onClick={() => toggle(question, option)}
                  className={`${chipClass} ${focusRing}`}
                >
                  {option}
                </button>
              ))}
            </div>
            {question.other && (
              <>
                <label htmlFor={`${ids}-${index}`} className="sr-only">
                  {question.text} Other answer
                </label>
                <input
                  id={`${ids}-${index}`}
                  type="text"
                  maxLength={80}
                  value={picked.others[question.id] ?? ""}
                  onChange={(event) =>
                    onChange({
                      ...picked,
                      others: { ...picked.others, [question.id]: event.target.value },
                    })
                  }
                  placeholder={question.other}
                  className={`mt-2.5 block min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] text-ink placeholder:text-slate-400 ${focusRing}`}
                />
              </>
            )}
          </fieldset>
        );
      })}
    </div>
  );
}
