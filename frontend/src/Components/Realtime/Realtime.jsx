import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Navbar from "../Store/Navbar";
import { apiFetch, clearAuthSession, getAuthToken, getStoredUser } from "../../lib/auth";
import "./Realtime.css";

const formatTime = (timestamp) => {
  if (!timestamp) return "";
  try {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
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
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

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
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  const onLogout = async () => {
    try {
      await apiFetch("/api/logout", { method: "POST" });
    } catch {
      // Local auth clear still happens if network logout fails.
    }
    clearAuthSession();
    navigate("/login");
  };

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
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

  return (
    <div className="realtime-page">
      <Navbar
        user={user}
        onLogout={onLogout}
        onSearchChange={setSearch}
        searchValue={search}
      />

      <main className="realtime-wrap">
        <div className="realtime-header">
          <div>
            <h1 className="realtime-title">Live Chat</h1>
            <p className="realtime-subtitle">Real-time communication through Socket.IO.</p>
          </div>

          <div className="realtime-controls">
            <span className={`realtime-status ${isConnected ? "is-online" : "is-offline"}`}>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
            <span className="realtime-status">Online: {onlineCount}</span>
            <button
              type="button"
              className="themeToggle"
              onClick={toggleTheme}
              aria-label="Toggle light mode"
              title="Toggle light/dark"
            >
              <span className="themeToggle__icon">{theme === "dark" ? "Moon" : "Sun"}</span>
              <span className={`themeToggle__track ${theme === "light" ? "isOn" : ""}`}>
                <span className="themeToggle__thumb" />
              </span>
            </button>
          </div>
        </div>

        <section className="realtime-panel">
          <div className="realtime-feed" ref={feedRef}>
            {messages.length === 0 ? (
              <p className="realtime-empty">No messages yet. Start the conversation.</p>
            ) : (
              messages.map((message) => {
                const isMine = message?.sender === user?.name;
                const isSystem = message?.type === "system";

                return (
                  <article
                    key={message?.id || `${message?.timestamp}-${message?.text}`}
                    className={`realtime-message ${isMine ? "is-mine" : ""} ${isSystem ? "is-system" : ""}`}
                  >
                    <header className="realtime-message-head">
                      <strong>{message?.sender || "Unknown"}</strong>
                      <time>{formatTime(message?.timestamp)}</time>
                    </header>
                    <p>{message?.text || ""}</p>
                  </article>
                );
              })
            )}
          </div>

          <form className="realtime-compose" onSubmit={sendMessage}>
            <input
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={isConnected ? "Type a message..." : "Connecting..."}
              maxLength={300}
              disabled={!isConnected}
            />
            <button type="submit" disabled={!isConnected || draft.trim() === ""}>
              Send
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
