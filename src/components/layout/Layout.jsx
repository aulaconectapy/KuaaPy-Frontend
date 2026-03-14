'use client';

import { useState, useEffect } from "react";
import AppLayoutContent from "./AppLayout"; // ruta relativa correcta

export default function Layout({ children }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null; // Evita renderizar en SSR

  return <AppLayoutContent>{children}</AppLayoutContent>;
}
