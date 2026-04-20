import api from "./api";

/**
 * Fetch all baggage records for a given ticket code.
 * GET /api/baggage/ticket/:ticketCode
 */
export const getBaggageByTicket = (ticketCode) =>
    api.get(`/baggage/ticket/${encodeURIComponent(ticketCode)}`);

/**
 * Create multiple baggage records (ticketCode will be null until attached).
 * POST /api/baggage/bulk
 */
export const createBaggageBulk = (baggageList) =>
    api.post("/baggage/bulk", baggageList);

/**
 * Attach created baggage records to their ticket codes.
 * PUT /api/baggage/attach-tickets
 * @param {Array<{ baggageId: string, ticketCode: string }>} updates
 */
export const attachBaggageToTickets = (updates) =>
    api.put("/baggage/attach-tickets", updates);

export const getPassengerBaggageForFlight = (flightNum) =>
    api.get(`/baggage/flight/${encodeURIComponent(flightNum)}/passengers`);

export const checkPassengerBagsForFlight = (flightNum, passengerId) =>
    api.put(`/baggage/flight/${encodeURIComponent(flightNum)}/check-passenger`, {
        passengerId,
    });

/**
 * Delete a single baggage record by its ID.
 * DELETE /api/baggage/:id
 */
export const deleteBaggage = (baggageId) =>
    api.delete(`/baggage/${encodeURIComponent(baggageId)}`);
