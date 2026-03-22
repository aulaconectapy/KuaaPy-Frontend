'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getMyDisciplineReports, getMyNotifications } from '@/services/api';
import socket from '@/services/socket';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Estados que el Layout NECESITA
  const [notifications, setNotifications] = useState([]);
  const [pendingReports, setPendingReports] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const updateData = async () => {
    if (!user) return;
    try {
      if (user.role === "estudiante") {
        const reports = await getMyDisciplineReports();
        setPendingReports(reports.filter(r => r.status === "Pendiente").length);
      } else if (user.role === "director/a") {
        const data = await getMyNotifications();
        setNotifications(data);
        setPendingReports(data.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error("Error actualizando notificaciones:", error);
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    updateData(); // Carga inicial

    // Manejo de Sockets con Feedback (Snackbar)
    const handleSocketEvent = (data) => {
      updateData();
      setSnackbar({ 
        open: true, 
        message: data?.message || "Nueva notificación recibida", 
        severity: user.role === "director/a" ? "error" : "warning" 
      });
    };

    socket.on("new-report", handleSocketEvent);
    socket.on("alert-report", handleSocketEvent);

    return () => {
      socket.off("new-report", handleSocketEvent);
      socket.off("alert-report", handleSocketEvent);
    };
  }, [user?._id, user?.role]);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      setNotifications,
      pendingReports, 
      setPendingReports,
      snackbar, 
      setSnackbar,
      updateData 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) return {}; // Seguridad extra para evitar el error de 'undefined'
  return context;
};