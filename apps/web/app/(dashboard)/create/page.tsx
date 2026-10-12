import type { Metadata } from "next";
import { CreateForm } from "./CreateForm";

export const metadata: Metadata = { title: "Create your website" };

export default function CreatePage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        Tell us about your business
      </h1>
      <p className="mt-3 text-lg text-slate-600">
        What do you do, where, and what makes you different? We&rsquo;ll handle the rest.
      </p>
      <CreateForm />
    </div>
  );
}
