import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket(sessionId: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io({ path: "/api/socket" });
    socketRef.current = socket;
    socket.emit("join-session", sessionId);
    return () => { socket.disconnect(); };
  }, [sessionId]);

  return socketRef;
}
