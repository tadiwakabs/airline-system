/*import api from "./api";

export const createPayment = (data) => api.post("/payment", data);
export const getPaymentById = (id) => api.get(`/payment/${id}`);*/

import axios from 'axios';

export const createPayment = (data) => {
  return axios.post('http://localhost:5127/api/payment', data);
};

import api from "./api";

export const completePendingPayment = async (transactionId, paymentMethod) => {
    const response = await api.put(`/payment/${transactionId}/complete`, {
        paymentMethod,
    });
    return response.data;
};