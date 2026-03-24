import api from "./api";

export const getAllFlights = () => api.get("/flights");

export const getFlightById = (id) => api.get(`/flights/${id}`);

export const createFlight = (data) => api.post("/flights", data);

export const updateFlight = (id, data) => api.put(`/flights/${id}`, data);

export const deleteFlight = (id) => api.delete(`/flights/${id}`);

export const searchFlightsByDestination = (dest) =>
    api.get(`/flights/search?dest=${encodeURIComponent(dest)}`);
