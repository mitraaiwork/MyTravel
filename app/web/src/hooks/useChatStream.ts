"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatMessage, TripPhase } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface UseChatStreamReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  sendMessage: (text: string) => Promise<void>;
  clearHistory: () => void;
}

export function useChatStream(tripId: string, phase: TripPhase): UseChatStreamReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  // Keep a ref to history for accurate multi-turn context without stale closures
  const historyRef = useRef<{ role: string; content: string }[]>([]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    historyRef.current = [];
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming || !text.trim()) return;

      const userMsg: ChatMessage = {
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, userMsg]);
      historyRef.current = [...historyRef.current, { role: "user", content: text.trim() }];

      // Placeholder assistant message that we'll stream into
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      setIsStreaming(true);

      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const response = await fetch(`${BASE_URL}/itinerary/${tripId}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            message: text.trim(),
            history: historyRef.current.slice(0, -1), // exclude the just-added user msg
            phase,
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error("Chat request failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6);
            if (payload === "[DONE]") break;
            // Unescape newlines encoded server-side
            const text = payload.replace(/\\n/g, "\n");
            accumulated += text;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: accumulated,
              };
              return updated;
            });
          }
        }

        historyRef.current = [
          ...historyRef.current,
          { role: "assistant", content: accumulated },
        ];
      } catch (err) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: "Sorry, I couldn't get a response. Please try again.",
          };
          return updated;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [tripId, phase, isStreaming]
  );

  return { messages, isStreaming, sendMessage, clearHistory };
}
