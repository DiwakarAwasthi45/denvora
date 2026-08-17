"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";

export default function CopilotPage() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  async function ask() {
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setReply("");
    try {
      const res = await fetch("/api/ai/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setReply(data?.message ?? `Request failed (HTTP ${res.status})`);
        return;
      }
      setReply(data.data.reply);
    } catch (e) {
      setReply("Request failed: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">Clinic Copilot</h1>
      <Card className="p-5">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="Ask the AI anything about your clinic operations..."
          className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-teal-500 focus:outline-none"
        />
        <button
          onClick={ask}
          disabled={busy}
          className="mt-3 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {busy ? "Thinking..." : "Ask"}
        </button>
        {reply && <pre className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm text-slate-700">{reply}</pre>}
      </Card>
    </div>
  );
}
