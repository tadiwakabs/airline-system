import api from "./api";

// Get all recurring schedules (with flight count etc.)
export const getAllRecurringSchedules = () => api.get("/recurring-schedules");

// Get a single schedule by id
export const getRecurringScheduleById = (id) => api.get(`/recurring-schedules/${id}`);

// Create a new schedule + generate its flights
export const createRecurringSchedule = (data) => api.post("/recurring-schedules", data);

// Update schedule fields + bulk-update / regenerate future flights
// PUT body: { ...scheduleFields, regenerate: boolean }
export const updateRecurringSchedule = (id, data) => api.put(`/recurring-schedules/${id}`, data);

// Delete a schedule — query param controls what happens to its flights
// deleteFlights=true  → also delete all future associated flights
// deleteFlights=false → unlink flights (set recurringScheduleId = NULL)
export const deleteRecurringSchedule = (id, deleteFlights) =>
    api.delete(`/recurring-schedules/${id}?deleteFlights=${deleteFlights}`);
