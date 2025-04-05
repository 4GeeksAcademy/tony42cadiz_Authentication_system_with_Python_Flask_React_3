import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { Context } from "../store/appContext";

export const PrivateRoute = ({ children }) => {
  const { store } = useContext(Context);
  
  if (!store.token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};