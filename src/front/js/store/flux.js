const getState = ({ getStore, getActions, setStore }) => {
	return {
	  store: {
		message: null,
		demo: [
		  {
			title: "FIRST",
			background: "white",
			initial: "white",
		  },
		  {
			title: "SECOND",
			background: "white",
			initial: "white",
		  },
		],
		token: null,
		registrationSuccess: false,
		registrationExists: false,
		registrationEmpty: false,
		registrationInProgress: false,
		registrationDoesntExist: false,
		registrationWrong: false,
	  },
	  actions: {
		// Setters para estados de registro
		setRegistrationEmpty: (value) => {
		  setStore({ registrationEmpty: value });
		},
		setRegistrationSuccess: (value) => {
		  setStore({ registrationSuccess: value });
		},
		setRegistrationExists: (value) => {
		  setStore({ registrationExists: value });
		},
		setRegistrationInProgress: (value) => {
		  setStore({ registrationInProgress: value });
		},
		setRegistrationDoesntExist: (value) => {
		  setStore({ registrationDoesntExist: value });
		},
		setRegistrationWrong: (value) => {
		  setStore({ registrationWrong: value });
		},
  
		// Función de registro mejorada
		register: async (email, password) => {
			setStore({ 
			  registrationInProgress: true,
			  registrationExists: false,
			  registrationEmpty: false 
			});
		  
			try {
			  const resp = await fetch(`${process.env.BACKEND_URL}/api/signup`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password })
			  });
		  
			  const data = await resp.json();
		  
			  if (!resp.ok) {
				let errorMsg = "Registration failed";
				if (resp.status === 409) {
				  errorMsg = "User already exists";
				} else if (resp.status === 500) {
				  errorMsg = "Server error. Please try again later.";
				}
				throw new Error(errorMsg);
			  }
		  
			  setStore({ 
				registrationSuccess: true,
				registrationInProgress: false 
			  });
			  
			  return true;
			  
			} catch (error) {
			  console.error("Registration error:", error);
			  setStore({ 
				registrationInProgress: false,
				registrationExists: error.message.includes("already exists")
			  });
			  throw error;
			}
		  },
  
		// Función de login mejorada
		login: async (email, password) => {
		  setStore({ 
			registrationInProgress: true,
			registrationWrong: false,
			registrationEmpty: false 
		  });
  
		  if (!email || !password) {
			setStore({ 
			  registrationEmpty: true,
			  registrationInProgress: false 
			});
			throw new Error("Email and password are required");
		  }
  
		  const requestOptions = {
			method: "POST",
			headers: {
			  "Content-Type": "application/json",
			},
			body: JSON.stringify({
			  email: email,
			  password: password,
			}),
		  };
  
		  try {
			const resp = await fetch(`${process.env.BACKEND_URL}/api/login`, requestOptions);
			const data = await resp.json();
  
			if (!resp.ok) {
			  setStore({ registrationWrong: true });
			  throw new Error(data.message || "Login failed");
			}
  
			if (!data.access_token) {
			  setStore({ registrationWrong: true });
			  throw new Error("No access token received");
			}
  
			sessionStorage.setItem("token", data.access_token);
			setStore({ 
			  token: data.access_token,
			  registrationInProgress: false,
			  registrationSuccess: true 
			});
  
			return true;
		  } catch (error) {
			console.error("Login error:", error);
			setStore({ 
			  registrationInProgress: false,
			  registrationWrong: true 
			});
			throw error;
		  }
		},
  
		// Sincronizar token desde sessionStorage
		syncTokenFromSessionStore: () => {
		  const token = sessionStorage.getItem("token");
		  if (token && token !== "" && token !== undefined) {
			setStore({ token: token });
		  }
		},
  
		// Función de logout
		logout: () => {
		  sessionStorage.removeItem("token");
		  setStore({ 
			token: null,
			message: null,
			registrationSuccess: false 
		  });
		  window.location.href = "/login";
		},
  
		// Obtener mensaje protegido
		getMessage: async () => {
		  const store = getStore();
		  if (!store.token) return;
  
		  try {
			const resp = await fetch(`${process.env.BACKEND_URL}/api/hello`, {
			  headers: {
				Authorization: `Bearer ${store.token}`,
			  },
			});
			
			if (!resp.ok) throw new Error("Failed to fetch message");
			
			const data = await resp.json();
			setStore({ message: data.message });
		  } catch (error) {
			console.error("Error loading message:", error);
			actions.logout(); // Cerrar sesión si hay error
		  }
		},
	  },
	};
  };
  
  export default getState;
