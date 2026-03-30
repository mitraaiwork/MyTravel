"use client";

import { useState, useCallback, useRef } from "react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000";

export type StreamStatus =
  | "idle"
  | "connecting"
  | "started"
  | "streaming"
  | "complete"
  | "error"
  | "cap_reached";

export interface DayStream {
  day: number;
  date: string;
  text: string;      // accumulating raw JSON for this day
  done: boolean;
  hasError: boolean;
}

interface UseItineraryStreamReturn {
  dayStreams: DayStream[];
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
  status: StreamStatus;
  startStream: (token: string) => void;
  reset: () => void;
}

export function useItineraryStream(tripId: string): UseItineraryStreamReturn {
  const [dayStreams, setDayStreams] = useState<DayStream[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StreamStatus>("idle");

  const wsRef = useRef<WebSocket | null>(null);
  const statusRef = useRef<StreamStatus>("idle");

  function updateStatus(s: StreamStatus) {
    statusRef.current = s;
    setStatus(s);
  }

  const reset = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setDayStreams([]);
    setIsStreaming(false);
    setIsComplete(false);
    setError(null);
    updateStatus("idle");
  }, []);

  const startStream = useCallback(
    (token: string) => {
      if (wsRef.current) {
        wsRef.current.close();
      }

      setDayStreams([]);
      setIsComplete(false);
      setError(null);
      updateStatus("connecting");
      setIsStreaming(true);

      const url = `${WS_URL}/itinerary/generate/${tripId}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event: MessageEvent<string>) => {
        try {
          const msg = JSON.parse(event.data) as {
            type: string;
            days?: { day: number; date: string }[];
            day?: number;
            content?: string;
            error?: string;
            message?: string;
          };

          switch (msg.type) {
            case "started":
              updateStatus("started");
              // Initialise a DayStream entry for every day
              if (msg.days) {
                setDayStreams(
                  msg.days.map((d) => ({
                    day: d.day,
                    date: d.date,
                    text: "",
                    done: false,
                    hasError: false,
                  }))
                );
              }
              break;

            case "day_chunk":
              updateStatus("streaming");
              setDayStreams((prev) =>
                prev.map((ds) =>
                  ds.day === msg.day
                    ? { ...ds, text: ds.text + (msg.content ?? "") }
                    : ds
                )
              );
              break;

            case "day_done":
              setDayStreams((prev) =>
                prev.map((ds) =>
                  ds.day === msg.day ? { ...ds, done: true } : ds
                )
              );
              break;

            case "day_error":
              setDayStreams((prev) =>
                prev.map((ds) =>
                  ds.day === msg.day ? { ...ds, done: true, hasError: true } : ds
                )
              );
              break;

            case "complete":
              updateStatus("complete");
              setIsComplete(true);
              setIsStreaming(false);
              ws.close();
              break;

            case "error":
              updateStatus("error");
              setError(msg.message ?? "An error occurred during generation.");
              setIsStreaming(false);
              ws.close();
              break;

            case "cap_reached":
              updateStatus("cap_reached");
              setError(
                msg.message ??
                  "You have reached your monthly generation limit. Upgrade to Premium for unlimited itineraries."
              );
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
        setError("WebSocket connection failed. Please check your connection and try again.");
        setIsStreaming(false);
      };

      ws.onclose = (event) => {
        const cur = statusRef.current;
        if (!event.wasClean && cur !== "complete" && cur !== "error" && cur !== "cap_reached") {
          updateStatus("error");
          setError("Connection closed unexpectedly. Please try again.");
          setIsStreaming(false);
        }
      };
    },
    [tripId]
  );

  return {
    dayStreams,
    isStreaming,
    isComplete,
    error,
    status,
    startStream,
    reset,
  };
}
