import api from "./api";

export const getMyStandbyOffers = async () => {
    const response = await api.get("/standby/me");
    return response.data;
};

export const acceptStandbyOffer = async (standbyId) => {
    const response = await api.put(`/standby/${standbyId}/accept`);
    return response.data;
};

export const rejectStandbyOffer = async (standbyId) => {
    const response = await api.put(`/standby/${standbyId}/reject`);
    return response.data;
};

export const joinStandby = async (flightNum) => {
    const response = await api.post("/standby", { flightNum });
    return response.data;
};