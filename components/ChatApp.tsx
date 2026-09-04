"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Profile = { id: string; company_name: string; contact_name: string; role: string; country: string | null };
type Message = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string };
type Conversation = { id: string; is_group: boolean; name: string | null };

export default function ChatApp() {
  const supabase = createClient();
  const [me, setMe] = useState<Profile | null>(null);
  const [directory, setDirectory] = useState<Profile[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load who I am, the member directory, and my existing conversations.
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setMe(myProfile);

      const { data: everyone } = await supabase.from("profiles").select("*").neq("id", user.id);
      setDirectory(everyone || []);

      const { data: participantRows } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      const ids = (participantRows || []).map((r) => r.conversation_id);
      if (ids.length) {
        const { data: convos } = await supabase.from("conversations").select("*").in("id", ids);
        setConversations(convos || []);
        if (convos && convos.length) setActiveId(convos[0].id);
      }
      setLoading(false);
    })();
  }, []);

  // Load message history for the active conversation, and subscribe to
  // new messages arriving live — this is the actual real-time part.
  useEffect(() => {
    if (!activeId) return;

    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    })();

    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const channel = supabase
      .channel(`messages:${activeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${activeId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();
    channelRef.current = channel;

    return () => { supabase.removeChannel(channel); };
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startConversation = async (otherId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Real, correct approach: only reuse an existing 1:1 conversation
    // if one already contains exactly these two people.
    const { data: mine } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", user.id);
    const { data: theirs } = await supabase.from("conversation_participants").select("conversation_id").eq("user_id", otherId);
    const mineIds = new Set((mine || []).map((r) => r.conversation_id));
    const shared = (theirs || []).map((r) => r.conversation_id).find((id) => mineIds.has(id));

    if (shared) { setActiveId(shared); return; }

    const { data: convo, error: convoErr } = await supabase.from("conversations").insert({ is_group: false }).select().single();
    if (convoErr || !convo) return;
    await supabase.from("conversation_participants").insert([
      { conversation_id: convo.id, user_id: user.id },
      { conversation_id: convo.id, user_id: otherId },
    ]);
    setConversations((prev) => [...prev, convo]);
    setActiveId(convo.id);
  };

  const send = async () => {
    if (!draft.trim() || !activeId || !me) return;
    const body = draft.trim();
    setDraft("");
    await supabase.from("messages").insert({ conversation_id: activeId, sender_id: me.id, body });
    // No local optimistic push needed — the Realtime subscription above
    // delivers it back to us the same way it delivers to everyone else,
    // which is a good sanity check that the live pipe actually works.
  };

  const nameFor = (userId: string) => {
    if (me && userId === me.id) return "You";
    return directory.find((d) => d.id === userId)?.company_name || "Member";
  };

  if (loading) return <div style={{ color: "#9AA5B1", padding: 40 }}>Loading…</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 260px 1fr", height: "calc(100vh - 56px)", background: "#0A0D12" }}>
      {/* Member directory — anyone signed in can start a conversation with anyone else */}
      <div style={{ borderRight: "1px solid #232A35", overflowY: "auto" }}>
        <div style={sectionHeader}>Members worldwide</div>
        {directory.map((d) => (
          <button key={d.id} onClick={() => startConversation(d.id)} style={memberRow}>
            <div style={{ fontWeight: 600, color: "#EDEFF2", fontSize: 13 }}>{d.company_name}</div>
            <div style={{ fontSize: 11, color: "#67707C" }}>{d.country || "—"} · {d.role}</div>
          </button>
        ))}
        {directory.length === 0 && <div style={{ padding: 16, fontSize: 12, color: "#67707C" }}>No other members yet — invite someone to sign up.</div>}
      </div>

      {/* Conversation list */}
      <div style={{ borderRight: "1px solid #232A35", overflowY: "auto" }}>
        <div style={sectionHeader}>Your conversations</div>
        {conversations.map((c) => (
          <button key={c.id} onClick={() => setActiveId(c.id)} style={{ ...memberRow, background: activeId === c.id ? "#1B212B" : "none" }}>
            <div style={{ fontSize: 13, color: "#EDEFF2" }}>{c.name || "Direct message"}</div>
          </button>
        ))}
        {conversations.length === 0 && <div style={{ padding: 16, fontSize: 12, color: "#67707C" }}>Pick someone from Members to start chatting.</div>}
      </div>

      {/* Active thread */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {activeId ? (
          <>
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {messages.map((m) => (
                <div key={m.id} style={{ marginBottom: 14, maxWidth: "70%", alignSelf: m.sender_id === me?.id ? "flex-end" : "flex-start" }}>
                  <div style={{ fontSize: 10, color: "#67707C", marginBottom: 2 }}>{nameFor(m.sender_id)}</div>
                  <div style={{
                    background: m.sender_id === me?.id ? "#2F80ED" : "#1B212B",
                    color: m.sender_id === me?.id ? "#fff" : "#EDEFF2",
                    borderRadius: 8, padding: "8px 12px", fontSize: 13, display: "inline-block",
                  }}>{m.body}</div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div style={{ display: "flex", gap: 8, padding: 16, borderTop: "1px solid #232A35" }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Message…"
                style={{ flex: 1, background: "#1B212B", border: "1px solid #232A35", borderRadius: 6, padding: "10px 12px", color: "#EDEFF2" }}
              />
              <button onClick={send} style={{ background: "#2F80ED", border: "none", borderRadius: 6, padding: "0 20px", color: "#fff", fontWeight: 600, cursor: "pointer" }}>Send</button>
            </div>
          </>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#67707C" }}>
            Select a member to start a real-time conversation.
          </div>
        )}
      </div>
    </div>
  );
}

const sectionHeader: React.CSSProperties = { padding: "14px 16px", fontSize: 11, color: "#67707C", textTransform: "uppercase", borderBottom: "1px solid #232A35" };
const memberRow: React.CSSProperties = { display: "block", width: "100%", textAlign: "left", background: "none", border: "none", borderBottom: "1px solid #232A35", padding: "12px 16px", cursor: "pointer" };
