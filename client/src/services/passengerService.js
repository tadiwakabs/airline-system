import api from "./api";

export const getPassengerByUserId = (userId) =>
    api.get(`/passenger/by-user/${encodeURIComponent(userId)}`);

export const createPassenger = (data) =>
    api.post("/passenger", data);

export const updatePassenger = (id, data) =>
    api.put(`/passenger/${id}`, data);

export const getSavedPassengers = () =>
    api.get("/passenger/saved");

export const createSavedPassenger = (data) =>
    api.post("/passenger/saved", data);

export const updateSavedPassenger = (id, data) =>
    api.put(`/passenger/saved/${id}`, data);

export const deleteSavedPassenger = (id) =>
    api.delete(`/passenger/saved/${id}`);

export const getCountries = () =>
    api.get("/lookup/countries");

export const getStates = () =>
    api.get("/lookup/states");

export async function getPassengersForFlight(flightNum) {
    const response = await api.get(`/ticket/flight/${flightNum}`);
    return response.data;
}

export async function getSeatsForFlight(flightNum) {
    const response = await api.get(`/seating/flight/${flightNum}`);
    return response.data;
}
