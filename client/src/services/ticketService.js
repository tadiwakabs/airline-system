import api from "./api"

export const getTicket = () => api.get("ticket");

export const modifyTicket = (ticketCode, data) => api.put(ticketCode, data);

export const deleteTicket = (ticketCode) => api.delete(ticketCode);

export const addTicket = (ticketCode) => api.put(ticketCode);