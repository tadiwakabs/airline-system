import api from "./api";

export const getSeatsForFlight = (flightNum) =>
    api.get(`/seating/flight/${flightNum}`);

export const reserveSeat = (payload) =>
    api.post("/seating/reserve", payload);

export const releaseSeat = (payload) =>
    api.post("/seating/release", payload);

export const finalizeSeat = (payload) =>
    api.post("/seating/finalize", payload);
