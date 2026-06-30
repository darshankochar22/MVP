import { useEffect, useState, useCallback, useRef } from "react";
import Button from "@/components/ui/Button";
import type { WhatsappContact, WhatsappMessage } from "@/types/api/Whatsapp";

interface Props { companyId: number; configured: boolean; }

const fmt = (ts?: string | null) => {
  if (!ts) return "";
  const d = new Date(/^\d+$/.test(ts) ? Number(ts) * 1000 : ts);
  return isNaN(d.getTime()) ? "" : d.toLocaleString([], { dateStyle: "short", timeStyle: "short" });
};

export default function InboxTab({ companyId, configured }: Props) {
  const [contacts, setContacts] = useState<WhatsappContact[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsappMessage[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const loadContacts = useCallback(async () => {
    const r = await window.api.whatsapp.getConversations(companyId);
    setContacts(r.success ? r.contacts : []);
  }, [companyId]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  // Pull the thread from the provider (poll) + cache; refresh the contact list for unread counts.
  const syncThread = useCallback(async (phone: string) => {
    setSyncing(true);
    const r = await window.api.whatsapp.syncConversation({ company_id: companyId, phone });
    if (r.success) setMessages(r.messages);
    setSyncing(false);
    loadContacts();
  }, [companyId, loadContacts]);

  const openContact = useCallback(async (phone: string) => {
    setSelected(phone);
    setMessages([]);
    await window.api.whatsapp.markRead({ company_id: companyId, phone });
    syncThread(phone);
  }, [companyId, syncThread]);

  // Poll the open conversation every 15s (desktop can't receive webhooks).
  useEffect(() => {
    if (!selected) return;
    const id = setInterval(() => syncThread(selected), 15000);
    return () => clearInterval(id);
  }, [selected, syncThread]);

  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    const r = await window.api.whatsapp.reply({ company_id: companyId, phone: selected, message: reply.trim() });
    setSending(false);
    if (r.success) { setReply(""); syncThread(selected); }
  };

  return (
    <div className="flex h-[calc(100vh-150px)] border-t border-zinc-200">
      {/* Conversation list */}
      <div className="w-72 border-r border-zinc-200 overflow-y-auto shrink-0">
        {contacts.length === 0 && (
          <div className="p-3 text-[11px] text-zinc-400">
            No conversations yet. Customers who message your number appear here; or import parties from the Compose tab.
          </div>
        )}
        {contacts.map((c) => (
          <button
            key={c.contact_id}
            onClick={() => openContact(c.phone)}
            className={`w-full text-left px-3 py-2 border-b border-zinc-100 hover:bg-zinc-50 ${selected === c.phone ? "bg-zinc-100" : ""}`}
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-zinc-900 truncate">{c.name || c.phone}</span>
              {!!c.unread_count && <span className="text-[10px] font-bold text-white bg-zinc-900 rounded-full px-1.5 min-w-[16px] text-center">{c.unread_count}</span>}
            </div>
            <div className="text-[10px] text-zinc-500 truncate">{c.last_message_text || c.phone}</div>
          </button>
        ))}
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-xs text-zinc-400">Select a conversation</div>
        ) : (
          <>
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200 shrink-0">
              <span className="text-xs font-semibold text-zinc-900">{contacts.find((c) => c.phone === selected)?.name || selected}</span>
              <Button variant="ghost" size="sm" onClick={() => syncThread(selected)} disabled={syncing}>{syncing ? "Syncing…" : "Sync"}</Button>
            </div>

            <div ref={threadRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-zinc-50">
              {messages.length === 0 && <div className="text-[11px] text-zinc-400 text-center mt-4">No messages.</div>}
              {messages.map((m) => (
                <div key={m.message_id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[70%] px-2.5 py-1.5 text-xs ${m.direction === "out" ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 text-zinc-900"}`}>
                    <div className="whitespace-pre-wrap break-words">{m.body || (m.type !== "text" ? `[${m.type}]` : "")}</div>
                    <div className={`text-[9px] mt-0.5 ${m.direction === "out" ? "text-zinc-400" : "text-zinc-400"}`}>{fmt(m.ts || m.created_at)}{m.direction === "out" && m.status ? ` · ${m.status}` : ""}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 p-2 border-t border-zinc-200 shrink-0">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                placeholder={configured ? "Type a reply… (24h session window)" : "Connect WhatsApp in Settings first"}
                disabled={!configured}
                className="flex-1 text-xs text-zinc-900 border border-zinc-300 px-2 h-8 outline-none focus:border-zinc-800 disabled:bg-zinc-50"
              />
              <Button variant="primary" size="sm" onClick={send} disabled={sending || !configured || !reply.trim()}>Send</Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
