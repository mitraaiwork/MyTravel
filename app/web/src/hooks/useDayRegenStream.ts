"use client";

import { useState, useCallback, useRef } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export type DayRegenStatus = "idle" | "connecting" | "streaming" | "complete" | "error";

interface UseDayRegenStreamReturn {
  text: string;
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
  status: DayRegenStatus;
  startRegen: (token: string, dayNum: number) => void;
  reset: () => void;
}

export function useDayRegenStream(tripId: string): UseDayRegenStreamReturn {
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<DayRegenStatus>("idle");

  const wsRef = useRef<WebSocket | null>(null);
  const statusRef = useRef<DayRegenStatus>("idle");

  function updateStatus(s: DayRegenStatus) {
    statusRef.current = s;
    setStatus(s);
  }

  const reset = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setText("");
    setIsStreaming(false);
    setIsComplete(false);
    setError(null);
    updateStatus("idle");
  }, []);

  const startRegen = useCallback(
    (token: string, dayNum: number) => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      setText("");
      setIsComplete(false);
      setError(null);
      updateStatus("connecting");
      setIsStreaming(true);

      const url = `${WS_URL}/itinerary/generate/${tripId}/day/${dayNum}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const msg = JSON.parse(event.data) as {
            type: string;
            day?: number;
            content?: string;
            message?: string;
          };

          switch (msg.type) {
            case "started":
              updateStatus("streaming");
              break;

            case "day_chunk":
              setText((prev) => prev + (msg.content ?? ""));
              break;

            case "complete":
              updateStatus("complete");
              setIsComplete(true);
              setIsStreaming(false);
              ws.close();
              break;

            case "error":
              updateStatus("error");
              setError(msg.message ?? "Regeneration failed.");
              setIsStreaming(false);
              ws.close();
              break;
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        updateStatus("error");
        setError("WebSocket connection failed.");
        setIsStreaming(false);
      };

      ws.onclose = (event) => {
        const cur = statusRef.current;
        if (!event.wasClean && cur !== "complete" && cur !== "error") {
          updateStatus("error");
          setError("Connection closed unexpectedly.");
          setIsStreaming(false);
        }
      };
    },
    [tripId]
  );

  return { text, isStreaming, isComplete, error, status, startRegen, reset };
}
