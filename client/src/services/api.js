import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: false
});

api.interceptors.response.use(
    res => res,
    err => {
        const url = err.config?.url || "";
        const isAuthRequest =
            url.includes("/auth/login") || url.includes("/auth/register");

        if (err.response?.status === 401 && !isAuthRequest) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.href = "/login";
        }

        return Promise.reject(err);
    }
);

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default api;
