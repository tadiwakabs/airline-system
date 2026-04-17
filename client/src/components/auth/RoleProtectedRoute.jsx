import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function RoleProtectedRoute({
   children,
   allowedRoles = [],
   allowedDepartments = [],
}) {
    const { isAuthenticated, user, loading } = useAuth();

    if (loading) return null;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!user) return null;

    const roleAllowed =
        allowedRoles.length === 0 || allowedRoles.includes(user.userRole);

    const departmentAllowed =
        allowedDepartments.length === 0 ||
        user.userRole === "Administrator" ||
        allowedDepartments.includes(user.department);

    if (!roleAllowed || !departmentAllowed) {
        return <Navigate to="/" replace />;
    }

    return children;
}
