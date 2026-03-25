import api from "./api";

export const getAllFlights = () => api.get("/flights");

export const getFlightById = (id) => api.get(`/flights/${id}`);

export const createFlight = (data) => api.post("/flights", data);

export const updateFlight = (id, data) => api.put(`/flights/${id}`, data);

export const deleteFlight = (id) => api.delete(`/flights/${id}`);

export const searchFlightResults = ({ from, to, date }) =>
    api.get(
        `/flights/search-results?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(date)}`
    );

export const createRecurringFlights = (data) =>
    api.post("/flights/recurring", data);

export const upsertFlightPricing = (flightNum, data) => 
    api.put(`/flights/${flightNum}/pricing`, data);
