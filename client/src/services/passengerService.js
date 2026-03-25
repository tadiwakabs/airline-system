import api from "./api";

export const getPassengerByUserId = (userId) =>
    api.get(`/passenger/by-user/${encodeURIComponent(userId)}`);

export const updatePassenger = (id, data) =>
    api.put(`/passenger/${id}`, data);

export const getCountries = () =>
    api.get("/lookup/countries");

export const getStates = () =>
    api.get("/lookup/states");
