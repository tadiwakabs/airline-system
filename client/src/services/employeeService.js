import api from "./api";

export async function getAllEmployees() {
    const response = await api.get("/employee");
    return response.data;
}

export async function getEmployeeById(employeeId) {
    const response = await api.get(`/employee/${employeeId}`);
    return response.data;
}

export async function createEmployee(payload) {
    const response = await api.post("/employee", payload);
    return response.data;
}

export async function updateEmployee(employeeId, payload) {
    const response = await api.put(`/employee/${employeeId}`, payload);
    return response.data;
}

export async function lookupUserByIdOrEmail(value) {
    const response = await api.get("/user/lookup", { params: { q: value } });
    return response.data;
}

export async function getCrewForFlight(flightNum) {
    const response = await api.get(`/employee/flight/${flightNum}/crew`);
    return response.data;
}

export async function assignCrewToFlight(payload) {
    const response = await api.post("/employee/flight/assign-crew", payload);
    return response.data;
}

export async function removeCrewFromFlight(flightNum, employeeId) {
    const response = await api.delete(`/employee/flight/${flightNum}/crew/${employeeId}`);
    return response.data;
}

export async function getMyUpcomingFlights() {
    const response = await api.get("/employee/my-upcoming-flights");
    return response.data;
}

export async function getPassengersForMyFlight(flightNum) {
    const response = await api.get(`/employee/my-flights/${flightNum}/passengers`);
    return response.data;
}

export async function markPassengerBoarded(flightNum, ticketCode) {
    const response = await api.put(`/employee/my-flights/${flightNum}/board/${ticketCode}`);
    return response.data;
}
