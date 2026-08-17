"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";

export default function AdvisorPage() {
  const [topic, setTopic] = useState("growth");
  const [advice, setAdvice] = useState("");
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    setAdvice("");
    try {
      const res = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setAdvice(data?.message ?? `Request failed (HTTP ${res.status})`);
        return;
      }
      setAdvice(data.data.advice);
    } catch (e) {
      setAdvice("Request failed: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Business Advisor</h1>
      <Card className="p-5">
        <label className="text-sm font-medium text-slate-700">Advisory topic</label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-teal-500 focus:outline-none"
          placeholder="e.g. growth, retention, pricing"
        />
        <button
          onClick={run}
          disabled={busy}
          className="mt-3 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {busy ? "Analyzing..." : "Get Advice"}
        </button>
        {advice && <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">{advice}</pre>}
      </Card>
    </div>
  );
}
