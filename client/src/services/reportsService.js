import api from "../api"; 

export const getODDemand = () => {
    return api.get("/reports/od-demand");
};

// Placeholder for future reports
export const getRouteVitality = () => {
    return api.get("/reports/route-vitality");
};

export const getRevenueLeakage = () => {
    return api.get("/reports/revenue-leakage");
};