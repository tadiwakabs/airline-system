import api from "./api.js";

export const createBooking = (data) => 
    api.post("/booking", data);

export const getFlightsByBooking = (bookingId) =>
    api.get(`/booking/${bookingId}/flights`);

export const getStatusByBooking = (query) =>
    api.get(`/booking/status?ref=${encodeURIComponent(query)}`);
