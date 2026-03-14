'use client';

import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>AulaConecta - Sistema de Autenticación</h1>
      <div>{children}</div> {/* Renderiza login y register */}
    </div>
  );
};

export default AuthLayout;
