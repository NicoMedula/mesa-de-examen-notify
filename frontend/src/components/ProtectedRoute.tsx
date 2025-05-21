import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  element: React.ReactNode;
  allowedRole?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, allowedRole }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    // Verificar si el usuario está autenticado
    const userRole = sessionStorage.getItem('userRole');
    const sessionId = sessionStorage.getItem('sessionId');
    
    // El usuario está autenticado si tiene un sessionId y un rol de usuario
    const authenticated = !!sessionId && !!userRole;
    
    // Si allowedRole está especificado, verificar si el usuario tiene ese rol
    const hasCorrectRole = !allowedRole || userRole === allowedRole;
    
    setIsAuthenticated(authenticated && hasCorrectRole);
  }, [allowedRole]);
  
  // Mientras verificamos la autenticación, mostramos nada
  if (isAuthenticated === null) {
    return null; 
  }
  
  // Si está autenticado y tiene el rol correcto, mostrar el elemento
  // Si no está autenticado o no tiene el rol correcto, redirigir a login
  return isAuthenticated ? (
    <>{element}</>
  ) : (
    <Navigate to="/login" replace />
  );
};

export default ProtectedRoute;
