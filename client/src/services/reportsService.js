import api from "./api";

export const getODDemand = () => api.get("/reports/od-demand");
export const getRouteVitality = () => api.get("/reports/route-vitality");
export const getRevenueLeakage = () => api.get("/reports/revenue-leakage");