import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function PublicOnlyRoute({ children, redirectTo = "/" }) {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to={redirectTo} replace />;
    }

    return children;
}
