"use client";

import { useState } from "react";
import { usePatient } from "@/components/portal/PatientShell";
import { Card, Empty } from "@/components/portal/ui";

interface Msg { id: number; from: "me" | "clinic"; text: string; at: string; }

export default function PortalMessages() {
  const { data } = usePatient();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const text = draft.trim();
    setMessages((m) => [...m, { id: Date.now(), from: "me", text, at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setDraft("");
    setTimeout(() => {
      setMessages((m) => [...m, { id: Date.now() + 1, from: "clinic", text: "Thanks for your message — our team will get back to you shortly.", at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    }, 800);
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto pb-3">
        {messages.length === 0 ? (
          <Empty text={`No messages with ${data.patient.name ? "your clinic" : "your clinic"} yet. Send a note below.`} />
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.from === "me" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                <p>{m.text}</p>
                <p className={`mt-0.5 text-[10px] ${m.from === "me" ? "text-indigo-100" : "text-slate-400"}`}>{m.at}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={send} className="flex gap-2 pt-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message to your clinic…"
          className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <button type="submit" className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Send</button>
      </form>
      <p className="mt-2 text-center text-[10px] text-slate-400">Demo thread — wire to your clinic&apos;s inbox to go live.</p>
    </div>
  );
}
