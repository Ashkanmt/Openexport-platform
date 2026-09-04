import ChatApp from "@/components/ChatApp";
import Header from "@/components/Header";

// Auth is already enforced by middleware.ts before this page renders —
// anyone unauthenticated gets redirected to /login before they see this.
export default function ChatPage() {
  return (
    <div style={{ background: "#0A0D12", minHeight: "100vh" }}>
      <Header active="Chat" />
      <ChatApp />
    </div>
  );
}
