import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function PublicOnlyRoute({ children, redirectTo = "/" }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (isAuthenticated) {
        const target = location.state?.from || redirectTo;

        return (
            <Navigate
                to={target}
                replace
                state={location.state?.pendingSelection
                    ? {
                        ...location.state.pendingSelection,
                        searchParams: location.state.searchParams,
                    }
                    : undefined}
            />
        );
    }

    return children;
}
