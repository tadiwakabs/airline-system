import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function RoleProtectedRoute({ children, allowedRoles }) {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!user) {
        return null;
    }

    if (!allowedRoles.includes(user.userRole)) {
        return <Navigate to="/" replace />;
    }

    return children;
}
