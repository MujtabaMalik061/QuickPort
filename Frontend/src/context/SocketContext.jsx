import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { userData } = useAuth();

  useEffect(() => {
    if (userData) {
      const newSocket = io(
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"
      );

      newSocket.on("connect", () => {
        if (userData.role === "driver") {
          newSocket.emit("join-room", userData._id, userData.role);
          console.log("Driver joined room:", `driver-${userData._id}`);
        } else {
          newSocket.emit("join-room", userData._id, userData.role);
        }
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [userData]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};
