import api from "./api";

export const getMyNotifications = async () => {
    const response = await api.get("/notifications/me");
    return response.data;
};

export const markNotificationAsRead = async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
};