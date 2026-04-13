CREATE OR REPLACE VIEW vw_od_market_demand AS
SELECT
    t.origin AS trueOrigin,
    t.destination AS trueDestination,
    COUNT(t.ticketCode) AS totalPassengers,
    ROUND(
        SUM(CASE WHEN f.flightNum != (
            SELECT MIN(t2.flightCode)
            FROM Ticket t2
            WHERE t2.bookingId = t.bookingId
        ) THEN 1 ELSE 0 END) * 100.0 / COUNT(t.ticketCode), 2
    ) AS connectionRatioPct,
    ROUND(SUM(t.price), 2) AS actualRevenue,
    ROUND(AVG(t.price) * COUNT(t.ticketCode) * 1.15, 2) AS potentialDirectRevenue
FROM Ticket t
JOIN Flight f ON t.flightCode = f.flightNum
WHERE t.status = 'Booked'
GROUP BY t.origin, t.destination
ORDER BY totalPassengers DESC;