import React, { useContext, useState } from "react";
import { Context } from "../store/appContext";
import { useNavigate, Link } from "react-router-dom";
import "../../styles/home.css";

export const Signup = () => {
  const { store, actions } = useContext(Context);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
  
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
  
    setLoading(true);
  
    try {
      const response = await fetch(`${process.env.BACKEND_URL}/api/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Registration failed");
      }

      // Redirigir inmediatamente a login con el email
      navigate("/login", {
        state: {
          registeredEmail: email,
          registrationSuccess: true
        }
      });

    } catch (error) {
      if (error.message.includes("already exists")) {
        setError("This email is already registered");
        setEmail("");
      } else {
        setError("Registration error: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center mt-6 home_max-width container">
      <h1 className="mb-4">Create account</h1>

      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle me-2"></i>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control"
            required
            autoFocus
          />
        </div>

        <div className="mb-3">
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
            required
            minLength="6"
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 py-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <span 
                className="spinner-border spinner-border-sm me-2" 
                role="status" 
                aria-hidden="true"
              ></span>
              Creating account...
            </>
          ) : (
            "Sign Up"
          )}
        </button>
      </form>

      <div className="mt-4">
        <p className="text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-primary">
            Log in here
          </Link>
        </p>
      </div>
    </div>
  );
};