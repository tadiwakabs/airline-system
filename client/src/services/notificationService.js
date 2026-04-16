import api from "./api";

export const getMyNotifications = async () => {
    const response = await api.get("/notifications/me");
    return response.data;
};