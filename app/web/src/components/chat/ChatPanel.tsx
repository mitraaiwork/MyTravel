"use client";

import { useState, useRef, useEffect } from "react";
import type { TripPhase, ChatMessage } from "@/types";
import { useChatStream } from "@/hooks/useChatStream";

const PHASE_LABELS: Record<TripPhase, { label: string; icon: string }> = {
  planning:   { label: "Planning",  icon: "🗺" },
  "pre-trip": { label: "Pre-Trip",  icon: "🎒" },
  "in-trip":  { label: "In-Trip",   icon: "📍" },
  "post-trip":{ label: "Post-Trip", icon: "✦"  },
};

const QUICK_QUESTIONS: Record<TripPhase, string[]> = {
  planning:   ["Best time to visit?", "Visa requirements?", "Budget tips?"],
  "pre-trip": ["What should I pack?", "Best airport transport?", "Local currency tips?"],
  "in-trip":  ["What's nearby right now?", "Best lunch spots today?", "How do I get around?"],
  "post-trip":["Similar destinations?", "What worked best on this trip?"],
};

interface ChatPanelProps {
  tripId: string;
  phase: TripPhase;
  onClose: () => void;
}

export function ChatPanel({ tripId, phase, onClose }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const { messages, isStreaming, sendMessage, clearHistory } = useChatStream(tripId, phase);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const phaseInfo = PHASE_LABELS[phase] ?? PHASE_LABELS.planning;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    await sendMessage(text);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex justify-end"
      style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col h-full shadow-2xl"
        style={{ width: "min(420px, 100%)", background: "var(--bg-cream)", borderLeft: "1px solid var(--border-mid)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div
          style={{
            background: "linear-gradient(135deg, #0d1f16 0%, #1b4332 60%, #2d6a4f 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            padding: "14px 16px",
            flexShrink: 0,
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* AI avatar */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #1b4332 0%, #0d9488 50%, #48cae4 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  border: "1.5px solid rgba(255,255,255,0.15)",
                }}
              >
                ✈
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.95)", fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
                  MyTravel Concierge
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                  <span style={{ fontSize: 10 }}>{phaseInfo.icon}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "rgba(116,198,157,0.95)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {phaseInfo.label} mode
                  </span>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#4ade80",
                      boxShadow: "0 0 6px rgba(74,222,128,0.6)",
                      display: "inline-block",
                      marginLeft: 2,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={clearHistory}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.55)",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 6,
                  padding: "4px 10px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.9)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                }}
              >
                Clear
              </button>
              <button
                onClick={onClose}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.55)",
                  fontSize: 18,
                  lineHeight: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.95)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(220,38,38,0.25)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(220,38,38,0.4)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.12)";
                }}
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* ── Messages ─────────────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}
        >
          {messages.length === 0 && (
            <EmptyState phase={phase} onSelect={sendMessage} />
          )}

          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              isStreaming={i === messages.length - 1 && msg.role === "assistant" && isStreaming}
            />
          ))}

          {isStreaming && messages[messages.length - 1]?.content === "" && (
            <div className="flex items-center gap-2" style={{ paddingLeft: 44 }}>
              <div style={{ display: "flex", gap: 5 }}>
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="animate-bounce"
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "var(--leaf)",
                      display: "inline-block",
                      animationDelay: `${delay}ms`,
                    }}
                  />
                ))}
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Thinking…</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* ── Input ────────────────────────────────────────────────── */}
        <div
          style={{
            padding: "12px 14px",
            borderTop: "1px solid var(--border-light)",
            background: "white",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your trip…"
              disabled={isStreaming}
              style={{
                flex: 1,
                fontSize: 13,
                padding: "10px 14px",
                borderRadius: 12,
                border: "1.5px solid var(--border-mid)",
                background: "var(--bg-mint)",
                color: "var(--text-dark)",
                outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                opacity: isStreaming ? 0.6 : 1,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "var(--leaf)";
                e.target.style.boxShadow = "0 0 0 3px rgba(82,183,136,0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--border-mid)";
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              style={{
                padding: "10px 16px",
                borderRadius: 12,
                background: input.trim() && !isStreaming
                  ? "linear-gradient(135deg, #1b4332, #2d6a4f)"
                  : "rgba(45,106,79,0.2)",
                color: input.trim() && !isStreaming ? "white" : "var(--text-faint)",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: input.trim() && !isStreaming ? "pointer" : "not-allowed",
                transition: "all 0.15s",
                flexShrink: 0,
                boxShadow: input.trim() && !isStreaming ? "0 2px 8px rgba(27,67,50,0.3)" : "none",
              }}
            >
              Send
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-faint)", textAlign: "center" }}>
            Press Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ────────────────────────────────────────────────────────── */
function EmptyState({ phase, onSelect }: { phase: TripPhase; onSelect: (q: string) => void }) {
  const questions = QUICK_QUESTIONS[phase] ?? QUICK_QUESTIONS.planning;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 8px", gap: 20 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1b4332 0%, #0d9488 50%, #48cae4 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          boxShadow: "0 4px 16px rgba(13,148,136,0.25)",
        }}
      >
        ✈
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-dark)", marginBottom: 4 }}>
          MyTravel Concierge
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 280 }}>
          Ask me anything about your trip — restaurants, transport, what to pack, local tips, or anything else.
        </div>
      </div>
      <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 2 }}>
          Try asking
        </div>
        {questions.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            style={{
              width: "100%",
              textAlign: "left",
              fontSize: 13,
              padding: "10px 14px",
              borderRadius: 10,
              background: "white",
              border: "1.5px solid var(--border-mid)",
              color: "var(--text-dark)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--leaf)";
              (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-mint)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--forest)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-mid)";
              (e.currentTarget as HTMLButtonElement).style.background = "white";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-dark)";
            }}
          >
            <span style={{ color: "var(--leaf)", fontSize: 14, flexShrink: 0 }}>›</span>
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Message bubble ─────────────────────────────────────────────────────── */
function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming: boolean }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            maxWidth: "78%",
            padding: "10px 14px",
            borderRadius: "16px 16px 4px 16px",
            background: "linear-gradient(135deg, #1b4332, #2d6a4f)",
            color: "white",
            fontSize: 13,
            lineHeight: 1.55,
            boxShadow: "0 2px 8px rgba(27,67,50,0.25)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      {/* AI avatar */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1b4332, #0d9488)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          flexShrink: 0,
          marginTop: 2,
          boxShadow: "0 1px 4px rgba(27,67,50,0.2)",
        }}
      >
        ✈
      </div>
      <div
        style={{
          maxWidth: "82%",
          padding: "12px 14px",
          borderRadius: "4px 16px 16px 16px",
          background: "white",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-sm)",
          fontSize: 13,
          color: "var(--text-dark)",
          lineHeight: 1.6,
          wordBreak: "break-word",
        }}
      >
        {renderMarkdown(message.content)}
        {isStreaming && (
          <span
            style={{
              display: "inline-block",
              width: 2,
              height: 13,
              background: "var(--leaf)",
              marginLeft: 2,
              verticalAlign: "middle",
              borderRadius: 1,
              animation: "pulse 1s ease-in-out infinite",
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ── Inline markdown renderer ───────────────────────────────────────────── */
function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ fontWeight: 700, color: "var(--text-dark)" }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          style={{
            background: "rgba(45,106,79,0.1)",
            padding: "1px 5px",
            borderRadius: 4,
            fontSize: 11,
            fontFamily: "monospace",
            color: "var(--forest)",
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("### ")) {
      nodes.push(
        <div key={i} style={{ fontWeight: 700, fontSize: 13, color: "var(--text-dark)", marginTop: 10, marginBottom: 3 }}>
          {formatInline(line.slice(4))}
        </div>
      );
    } else if (line.startsWith("## ")) {
      nodes.push(
        <div key={i} style={{ fontWeight: 700, fontSize: 14, color: "var(--text-dark)", marginTop: 12, marginBottom: 4 }}>
          {formatInline(line.slice(3))}
        </div>
      );
    } else if (line.startsWith("# ")) {
      nodes.push(
        <div key={i} style={{ fontWeight: 800, fontSize: 15, color: "var(--text-dark)", marginTop: 12, marginBottom: 6 }}>
          {formatInline(line.slice(2))}
        </div>
      );
    } else if (line.match(/^[-*•]\s/)) {
      nodes.push(
        <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 3 }}>
          <span style={{ color: "var(--forest)", fontWeight: 700, flexShrink: 0, lineHeight: 1.6 }}>•</span>
          <span style={{ flex: 1 }}>{formatInline(line.slice(2))}</span>
        </div>
      );
    } else if (line.match(/^\d+\.\s/)) {
      const match = line.match(/^(\d+)\.\s(.*)/);
      if (match) {
        nodes.push(
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 3 }}>
            <span style={{ color: "var(--forest)", fontWeight: 700, flexShrink: 0, minWidth: 18, lineHeight: 1.6 }}>
              {match[1]}.
            </span>
            <span style={{ flex: 1 }}>{formatInline(match[2])}</span>
          </div>
        );
      }
    } else if (line.startsWith("> ")) {
      nodes.push(
        <div
          key={i}
          style={{
            borderLeft: "3px solid var(--leaf)",
            paddingLeft: 10,
            marginTop: 6,
            marginBottom: 6,
            color: "var(--text-muted)",
            fontStyle: "italic",
            fontSize: 12,
          }}
        >
          {formatInline(line.slice(2))}
        </div>
      );
    } else if (line.trim() === "") {
      nodes.push(<div key={i} style={{ height: 6 }} />);
    } else {
      nodes.push(
        <div key={i} style={{ marginBottom: 2, lineHeight: 1.6 }}>
          {formatInline(line)}
        </div>
      );
    }
    i++;
  }
  return <>{nodes}</>;
}
