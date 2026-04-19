import { createContext, useContext, useMemo, useState } from "react";
import { loginUser } from "../services/authService";

const AuthContext = createContext(null);

function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split(".")[1]));
    } catch {
        return null;
    }
}

function isTokenExpired(token) {
    const payload = parseJwt(token);
    return !payload?.exp || payload.exp * 1000 < Date.now();
}

export function AuthProvider({ children }) {
    const rawUser = localStorage.getItem("user");
    const rawToken = localStorage.getItem("token");

    const tokenValid = rawToken && !isTokenExpired(rawToken);

    if (!tokenValid) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    }

    const [user, setUser] = useState(
        tokenValid && rawUser ? JSON.parse(rawUser) : null
    );
    const [token, setToken] = useState(tokenValid ? rawToken : null);
    const [isAuthenticated, setIsAuthenticated] = useState(!!tokenValid);
    const [loading, setLoading] = useState(false);

    const login = async ({ username, password }) => {
        setLoading(true);

        try {
            const data = await loginUser({ username, password });

            const authUser = {
                userId: data.userId,
                username: data.username,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                userRole: data.userRole,
                department: data.department || null,
            };

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(authUser));

            setToken(data.token);
            setUser(authUser);
            setIsAuthenticated(true);

            return { success: true, data };
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                "Login failed. Please check your credentials and try again.";

            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    const loginWithToken = (data) => {
        const authUser = {
            userId: data.userId,
            username: data.username,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            userRole: data.userRole,
            department: data.department || null,
        };

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(authUser));

        setToken(data.token);
        setUser(authUser);
        setIsAuthenticated(true);
    };

    const updateUser = (updates) => {
        setUser((prev) => {
            if (!prev) return prev;

            const nextUser = {
                ...prev,
                ...updates,
            };

            localStorage.setItem("user", JSON.stringify(nextUser));
            return nextUser;
        });
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = useMemo(
        () => ({
            user,
            token,
            isAuthenticated,
            loading,
            login,
            loginWithToken,
            updateUser,
            logout,
        }),
        [user, token, isAuthenticated, loading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside an AuthProvider");
    }

    return context;
}
