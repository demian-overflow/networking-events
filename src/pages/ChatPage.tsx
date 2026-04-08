import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { io, type Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3002";

interface ChatMessage {
  id: number;
  userName: string;
  text: string;
  timestamp: string;
  system?: boolean;
}

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [userName, setUserName] = useState("");
  const [typingUser, setTypingUser] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const socket = io(API_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("chat:welcome", (data: { message: string; userName: string }) => {
      setUserName(data.userName);
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), userName: "System", text: data.message, timestamp: new Date().toISOString(), system: true },
      ]);
    });

    socket.on("chat:message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      setTypingUser("");
    });

    socket.on("chat:system", (data: { message: string }) => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), userName: "System", text: data.message, timestamp: new Date().toISOString(), system: true },
      ]);
    });

    socket.on("chat:typing", (data: { userName: string }) => {
      setTypingUser(data.userName);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => setTypingUser(""), 2000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !socketRef.current) return;
    socketRef.current.emit("chat:message", { text });
    setInput("");
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    socketRef.current?.emit("chat:typing");
  }

  return (
    <div className="page-container chat-container">
      <div className="page-header">
        <Link to="/" className="back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          На головну
        </Link>
      </div>

      <div className="chat-card">
        <div className="chat-header">
          <h2 className="page-title">Чат підтримки</h2>
          <span className={`chat-status ${connected ? "online" : ""}`}>
            {connected ? "Online" : "Offline"}
          </span>
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-msg ${msg.system ? "chat-msg-system" : msg.userName === userName ? "chat-msg-own" : ""}`}
            >
              {!msg.system && msg.userName !== userName && (
                <span className="chat-msg-author">{msg.userName}</span>
              )}
              <div className="chat-msg-bubble">
                <span>{msg.text}</span>
                <span className="chat-msg-time">
                  {new Date(msg.timestamp).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}
          {typingUser && (
            <div className="chat-typing">{typingUser} друкує...</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input-row" onSubmit={sendMessage}>
          <input
            type="text"
            className="chat-input"
            placeholder="Введіть повідомлення..."
            value={input}
            onChange={handleInputChange}
            disabled={!connected}
          />
          <button type="submit" className="btn btn-primary" disabled={!connected || !input.trim()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
