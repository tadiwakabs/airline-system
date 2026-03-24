import api from "./api";

// Get all aircraft
export const getAllAircraft = () => api.get("/aircraft");

// Get single aircraft by tail number
export const getAircraftByTail = (tailnumber) => api.get(`/aircraft/${tailnumber}`);

// Create new aircraft
export const createAircraft = (data) => api.post("/aircraft", data);

// Update existing aircraft
export const updateAircraft = (tailnumber, data) => api.put(`/aircraft/${tailnumber}`, data);

// Delete aircraft
export const deleteAircraft = (tailnumber) => api.delete(`/aircraft/${tailnumber}`);