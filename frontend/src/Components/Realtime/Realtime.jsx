import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Navbar from "../Store/Navbar";
import Footer from "../UI/Footer";
import { apiFetch, clearAuthSession, getAuthToken, getStoredUser } from "../../lib/auth";

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  try {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

export default function Realtime() {
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [onlineCount, setOnlineCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const [user] = useState(() => getStoredUser());
  const [token] = useState(() => getAuthToken());
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const feedRef = useRef(null);

  useEffect(() => {
    if (!user || !token) {
      navigate("/login");
      return;
    }

    const socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"]
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("chat:join", { name: user.name });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("chat:history", (history) => {
      const safeHistory = Array.isArray(history) ? history : [];
      setMessages(safeHistory);
    });

    socket.on("chat:message", (message) => {
      setMessages((prev) => [...prev, message].slice(-100));
    });

    socket.on("chat:presence", (payload) => {
      const nextCount = Number(payload?.onlineCount);
      setOnlineCount(Number.isFinite(nextCount) ? nextCount : 0);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [navigate, token, user]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  const onLogout = async () => {
    try { await apiFetch("/api/logout", { method: "POST" }); } catch { /* ignore */ }
    clearAuthSession();
    navigate("/login");
  };

  const sendMessage = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !socketRef.current || !isConnected) {
      return;
    }

    socketRef.current.emit("chat:message", { text });
    setDraft("");
  };

  const remainingChars = 300 - draft.length;

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Navbar user={user} onLogout={onLogout} onSearchChange={setSearch} searchValue={search} />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-6 pt-12 pb-24 flex flex-col items-center">
        
        <div className="w-full max-w-4xl flex items-end justify-between border-b border-outline-variant/30 pb-6 mb-8">
          <div>
            <h1 className="font-display text-4xl text-primary mb-2">Shoply Lounge</h1>
            <p className="font-body text-on-surface-variant font-medium text-lg">Real-time discussion and service.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-6 mt-6 sm:mt-0">
            <span className={`flex items-center text-sm font-semibold uppercase tracking-widest ${isConnected ? "text-green-600" : "text-red-500"}`}>
               <span className={`w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-green-500" : "bg-red-500"}`}></span>
               {isConnected ? "Connected" : "Disconnected"}
            </span>
            <span className="text-sm font-semibold uppercase tracking-widest text-on-surface-variant border-x border-outline-variant/30 px-6 py-2">
              {onlineCount} Online
            </span>
          </div>
        </div>

        <section className="bg-surface-container-lowest w-full max-w-4xl flex flex-col h-[600px] outline outline-1 outline-outline-variant/30 shadow-ambient">
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar" ref={feedRef}>
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-on-surface-variant font-medium text-lg">
                No messages yet. Start the conversation.
              </div>
            ) : (
              messages.map((message) => {
                const isMine = message?.sender === user?.name;
                const isSystem = message?.type === "system";

                if (isSystem) {
                  return (
                    <div key={message?.id || `${message?.timestamp}-${message?.text}`} className="text-center">
                      <span className="text-xs uppercase tracking-widest font-semibold text-outline-variant bg-surface-container-low px-4 py-1 rounded-full">
                        {message.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <article
                    key={message?.id || `${message?.timestamp}-${message?.text}`}
                    className={`flex flex-col max-w-[80%] ${isMine ? "self-end items-end ml-auto" : "self-start items-start mr-auto"}`}
                  >
                    <header className="flex items-center gap-3 mb-1 px-1">
                      <strong className={`text-xs uppercase tracking-widest ${isMine ? "text-secondary" : "text-primary"}`}>
                        {message?.sender || "Unknown"}
                      </strong>
                      <time className="text-xs text-outline">{formatTime(message?.timestamp)}</time>
                    </header>
                    <div className={`px-5 py-3 text-sm font-medium leading-relaxed shadow-sm ${isMine ? "bg-primary text-surface-container-low rounded-t-2xl rounded-bl-2xl rounded-br-sm" : "bg-surface-container-highest text-primary rounded-t-2xl rounded-br-2xl rounded-bl-sm"}`}>
                      {message?.text || ""}
                    </div>
                  </article>
                );
              })
            )}
          </div>

          <form className="p-6 border-t border-outline-variant/30 bg-surface-container-low flex flex-col gap-4" onSubmit={sendMessage}>
            <div className="flex gap-4">
              <input
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={isConnected ? "Message Shoply support..." : "Connecting..."}
                maxLength={300}
                disabled={!isConnected}
                className="ghost-input flex-1 px-4 py-3 bg-surface-container-lowest focus:border-secondary transition-colors"
                autoComplete="off"
              />
              <button 
                type="submit" 
                disabled={!isConnected || draft.trim() === ""}
                className="arcade-btn px-8 disabled:opacity-50 tracking-widest"
              >
                Send
              </button>
            </div>
            <div className="text-right text-xs uppercase tracking-widest text-outline-variant font-semibold pr-2">
              {remainingChars} characters remaining
            </div>
          </form>
        </section>

      </main>

      <Footer />
    </div>
  );
}
