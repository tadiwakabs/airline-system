import api from "./api";
import axios from "axios";

const API_URL = "http://localhost:5127/api"; 
export const getStates = () => api.get(`/Lookup/States`);
// Get all airports
export const getAllAirports = () => api.get("/airport");

// Get a single airport by its 3-letter code (e.g., IAH)
export const getAirportByCode = (code) => api.get(`/airport/${code}`);

// Create a new airport entry
export const createAirport = (data) => api.post("/airport", data);

// Update an existing airport's details
// 'code' is the ID in the URL, 'data' is the Airport object in the body
export const updateAirport = (code, data) => api.put(`/airport/${code}`, data);

// Delete an airport from the system
export const deleteAirport = (code) => api.delete(`/airport/${code}`)