import api from "../api"; 

export const getRevenueReport = () => api.get("/reports/revenue");
export const getPopularityReport = () => api.get("/reports/popularity");
export const getActivityReport = () => api.get("/reports/activity");

export const getODDemand = () => api.get("/reports/od-demand");
export const getRouteVitality = () => api.get("/reports/route-vitality");
export const getRevenueLeakage = () => api.get("/reports/revenue-leakage");

const reportsService = {
    getRevenueReport,
    getPopularityReport,
    getActivityReport,
    getODDemand,
    getRouteVitality,
    getRevenueLeakage
};

export default reportsService;