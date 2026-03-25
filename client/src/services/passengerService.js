import api from "./api";

export const getPassengerByUserId = (userId) =>
    api.get(`/passenger/by-user/${encodeURIComponent(userId)}`);
