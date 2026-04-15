import api from "./api";

export const getMyNotifications = async () => {
    const response = await api.get("/notifications/me");
    return response.data;
};

export const getMyStandbyOffers = async () => {
    const response = await api.get("/standby/me");
    return response.data;
};

export const acceptStandbyOffer = async (standbyId) => {
    const response = await api.put(`/standby/${standbyId}/accept`);
    return response.data;
};