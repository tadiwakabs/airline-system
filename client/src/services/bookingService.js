import axios from 'axios';

export const createBooking = (data) => {
  return axios.post('http://localhost:5127/api/booking', data);
};