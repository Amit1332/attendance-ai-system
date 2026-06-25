import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketStats {
  onlineCount: number;
  offlineCount: number;
}

interface LiveEvent {
  id: string;
  type: "checkin" | "checkout";
  employeeName: string;
  role: string;
  time: string;
}

interface SocketContextType {
  socket: Socket | null;
  stats: SocketStats;
  liveEvents: LiveEvent[];
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stats, setStats] = useState<SocketStats>({ onlineCount: 0, offlineCount: 0 });
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // Connect to Socket.IO server on backend port 5000
    const newSocket = io("http://localhost:5000", {
      transports: ["websocket"],
      auth: { token },
    });

    setSocket(newSocket);

    // Listen to real-time stats updates
    newSocket.on("stats:update", (data: SocketStats) => {
      setStats(data);
    });

    // Listen to checkin updates
    newSocket.on("attendance:checkin", (data: any) => {
      const newEvent: LiveEvent = {
        id: data.id,
        type: "checkin",
        employeeName: `${data.user.firstName} ${data.user.lastName}`,
        role: data.user.role,
        time: new Date(data.checkIn).toLocaleTimeString(),
      };
      setLiveEvents((prev) => [newEvent, ...prev].slice(0, 15));
    });

    // Listen to checkout updates
    newSocket.on("attendance:checkout", (data: any) => {
      const newEvent: LiveEvent = {
        id: data.id,
        type: "checkout",
        employeeName: `${data.user.firstName} ${data.user.lastName}`,
        role: data.user.role,
        time: new Date(data.checkOut).toLocaleTimeString(),
      };
      setLiveEvents((prev) => [newEvent, ...prev].slice(0, 15));
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, stats, liveEvents }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
