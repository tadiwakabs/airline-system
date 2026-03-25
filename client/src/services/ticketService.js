import api from "./api"

export const getTicket = () => api.get("/ticket");

export const modifyTicket = (ticketCode, data) => api.put(`/ticket/${ticketCode}`, data);

export const deleteTicket = (ticketCode) => api.delete(`/ticket/${ticketCode}`);

export const addTicket = (ticketCode) => api.post("/ticket", data);