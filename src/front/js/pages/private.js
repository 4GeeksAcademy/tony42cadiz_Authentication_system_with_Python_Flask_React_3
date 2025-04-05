import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Context } from "../store/appContext";

export const Private = (props) => {
  const { store } = useContext(Context);
  const navigate = useNavigate();

  useEffect(() => {
    if (!store.token) {
      navigate("/login");
    }
  }, [store.token, navigate]);

  if (!store.token) {
    return null; // O un spinner de carga
  }

  return (
    <div className="centered">
      <h1 className="display-4">
        This is your private area
      </h1>
    </div>
  );
};