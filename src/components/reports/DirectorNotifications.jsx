'use client';

import React, { useEffect, useState } from "react";
import { IconButton, Badge, Menu, MenuItem, Typography, ListItemText, ListItemSecondaryAction, Button } from "@mui/material";
import { Notifications as NotificationsIcon } from "@mui/icons-material";
import { useAuth } from "@/context/AuthContext";
import { getMyNotifications, markAsRead } from "@/services/api";
import { useRouter } from "next/navigation";
import socket from "@/services/socket";

export default function DirectorNotifications() {
  const { user } = useAuth();
  const router = useRouter();

  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const open = Boolean(anchorEl);

  // Abrir menú campana
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  // Cerrar menú campana
  const handleClose = () => {
    setAnchorEl(null);
  };

  // =========================
  // CARGAR NOTIFICACIONES
  // =========================
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await getMyNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  // =========================
  // SOCKET: recibir alertas
  // =========================
  useEffect(() => {
    if (!user) return;

    const handleAlert = (data) => {
      setNotifications(prev => [data, ...prev]);
    };

    socket.on("alert-report", handleAlert);

    return () => {
      socket.off("alert-report", handleAlert);
    };
  }, [user]);

  // =========================
  // Marcar como leído
  // =========================
  const handleMarkAsRead = async (id, link) => {
    try {
      await markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      if (link) router.push(link);
    } catch (error) {
      console.error("Error marcando como leído:", error);
    }
  };

  // =========================
  // Cantidad de sin leer
  // =========================
  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user || user.role !== "director/a") return null;

  return (
    <>
      <IconButton onClick={handleClick} size="small">
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: { maxHeight: 400, width: '300px' }
        }}
      >
        {notifications.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2" color="textSecondary">
              No hay notificaciones
            </Typography>
          </MenuItem>
        )}

        {notifications.map(n => (
          <MenuItem key={n._id} onClick={() => handleMarkAsRead(n._id, "/reportes")} 
                    sx={{ bgcolor: n.read ? 'white' : '#F0FDF4', mb: 0.5, borderRadius: 1 }}>
            <ListItemText
              primary={<Typography variant="body2">{n.message}</Typography>}
              secondary={n.student ? `Alumno: ${n.student.firstName} ${n.student.lastName}` : null}
            />
            {!n.read && (
              <ListItemSecondaryAction>
                <Button size="small" onClick={() => handleMarkAsRead(n._id, "/reportes")}>
                  Ver
                </Button>
              </ListItemSecondaryAction>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}