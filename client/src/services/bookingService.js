import api from "./api.js";

export const createBooking = (data) => 
    api.post("/booking", data);