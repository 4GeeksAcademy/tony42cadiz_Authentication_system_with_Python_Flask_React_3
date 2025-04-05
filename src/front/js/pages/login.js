import React, { useContext, useState, useEffect } from "react";
import { Context } from "../store/appContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "../../styles/home.css";

export const Login = () => {
  const { store, actions } = useContext(Context);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Efecto combinado para manejar tanto la redirección desde signup como el prellenado de email
  useEffect(() => {
    if (location.state?.fromSignup) {
      setShowWelcome(true);
    }
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
    }
  }, [location]);

  console.log("this is your token", store.token);

  const handleClick = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      actions.setRegistrationEmpty(true);
      window.location.href = "/login";
      return;
    }

    actions.setRegistrationInProgress(true);
    try {
      const loginSuccess = await actions.login(email, password);
      actions.setRegistrationInProgress(false);
      if (loginSuccess) {
        navigate("/");
      } else {
        actions.setRegistrationWrong(true);
        window.location.href = "/login";
      }
    } catch (error) {
      actions.setRegistrationWrong(true);
      actions.setRegistrationInProgress(false);
    }
  };

  return (
    <div className="text-center mt-6 home_max-width container">
      {/* Mensaje de bienvenida para usuarios recién registrados */}
      {(showWelcome || location.state?.registrationSuccess) && (
        <div className="alert alert-success mb-4">
          ¡Registro completado! Por favor inicia sesión con tus credenciales.
        </div>
      )}

      {!store.registrationSuccess && <h1>Log In</h1>}

      {store.registrationSuccess && (
        <div className="fs-3">You are successfully logged in!</div>
      )}

      {store.registrationEmpty && (
        <div className="fs-3">
          Email and password are required.
          <br />
          Try again!
        </div>
      )}

      {store.registrationWrong && (
        <div className="fs-3">
          Email or password are wrong.
          <br />
          Try again!
        </div>
      )}

      {!store.registrationSuccess && (
        <div>
          <form onSubmit={handleClick}>
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-control mt-3"
            />
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control mt-3"
            />
            <button
              type="submit"
              className="btn btn-primary mt-5"
              disabled={store.registrationInProgress}
            >
              {store.registrationInProgress ? (
                <>
                  <span 
                    className="spinner-border spinner-border-sm me-2" 
                    role="status" 
                    aria-hidden="true"
                  ></span>
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>
          <p className="mt-3 mb-5" style={{ fontSize: "1.5rem" }}>
            Are you new here? <Link to="/signup">Sign up first </Link>
          </p>
        </div>
      )}
    </div>
  );
};