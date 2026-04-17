CREATE OR REPLACE VIEW vw_route_vitality_matrix AS
SELECT
    f.departingPort,
    f.arrivingPort,
    f.flightNum,
    COUNT(t.ticketCode) AS bookedPassengers,
    a.numSeats AS totalCapacity,
    ROUND(COUNT(t.ticketCode) * 100.0 / a.numSeats, 2) AS actualLoadFactorPct,
    ROUND(AVG(t.price), 2) AS avgTicketPrice,
    ROUND(SUM(t.price) / NULLIF(f.distance, 0) / NULLIF(COUNT(t.ticketCode), 0), 4) AS passengerYield,
    -- Break-even load factor assumes fixed cost baseline of $15 per seat per km
    ROUND((15 * a.numSeats * f.distance) / NULLIF(AVG(t.price) * a.numSeats, 0) * 100, 2) AS breakEvenLoadFactorPct,
    CASE
        WHEN ROUND(AVG(t.price), 2) >= (SELECT AVG(price) FROM Ticket WHERE status = 'Booked')
             AND ROUND(COUNT(t.ticketCode) * 100.0 / a.numSeats, 2) >= 70
            THEN 'High Yield / High Load'
        WHEN ROUND(AVG(t.price), 2) >= (SELECT AVG(price) FROM Ticket WHERE status = 'Booked')
             AND ROUND(COUNT(t.ticketCode) * 100.0 / a.numSeats, 2) < 70
            THEN 'High Yield / Low Load'
        WHEN ROUND(AVG(t.price), 2) < (SELECT AVG(price) FROM Ticket WHERE status = 'Booked')
             AND ROUND(COUNT(t.ticketCode) * 100.0 / a.numSeats, 2) >= 70
            THEN 'Low Yield / High Load'
        ELSE 'Low Yield / Low Load'
    END AS quadrant
FROM Flight f
JOIN Aircraft a ON f.aircraftUsed = a.tailNumber
LEFT JOIN Ticket t ON t.flightCode = f.flightNum AND t.status = 'Booked'
GROUP BY f.flightNum, f.departingPort, f.arrivingPort, a.numSeats, f.distance
ORDER BY actualLoadFactorPct DESC;