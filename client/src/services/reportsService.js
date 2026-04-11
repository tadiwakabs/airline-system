import api from "./api";

export const getODDemand = (startDate, endDate) => 
    api.get("/reports/od-demand", { params: { startDate, endDate } });

export const getRouteVitality = (startDate, endDate) => 
    api.get("/reports/route-vitality", { params: { startDate, endDate } });

export const getRevenueLeakage = (startDate, endDate) => 
    api.get("/reports/revenue-leakage", { params: { startDate, endDate } });