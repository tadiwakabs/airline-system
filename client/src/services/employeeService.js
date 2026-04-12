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
