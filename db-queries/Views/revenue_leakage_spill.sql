/*CREATE OR REPLACE VIEW vw_revenue_leakage_spill AS
SELECT
    f.flightNum,
    f.departingPort,
    f.arrivingPort,
    f.distance,
    a.numSeats AS capacity,
    COUNT(t.ticketCode) AS bookedPassengers,
    ROUND(COUNT(t.ticketCode) * 100.0 / a.numSeats, 2) AS loadFactorPct,
    ROUND(SUM(t.price), 2) AS totalRevenue,
    -- RASK: Revenue per Available Seat Kilometer
    ROUND(SUM(t.price) / NULLIF(a.numSeats * f.distance, 0), 4) AS RASK,
    -- Network average RASK for comparison
    ROUND((SELECT SUM(t2.price) / NULLIF(SUM(a2.numSeats * f2.distance), 0)
           FROM Ticket t2
           JOIN Flight f2 ON t2.flightCode = f2.flightNum
           JOIN Aircraft a2 ON f2.aircraftUsed = a2.tailNumber
           WHERE t2.status = 'Booked'), 4) AS networkAvgRASK,
    -- Spill estimate: if load factor > 95%, assume 10% additional demand was turned away
    CASE
        WHEN ROUND(COUNT(t.ticketCode) * 100.0 / a.numSeats, 2) >= 95
            THEN ROUND(a.numSeats * 0.10 * AVG(t.price), 2)
        ELSE 0
    END AS estimatedSpillCost,
    -- Unconstrained demand estimate
    CASE
        WHEN ROUND(COUNT(t.ticketCode) * 100.0 / a.numSeats, 2) >= 95
            THEN CEIL(a.numSeats * 1.10)
        ELSE COUNT(t.ticketCode)
    END AS unconstrainedDemandEstimate
FROM Flight f
JOIN Aircraft a ON f.aircraftUsed = a.tailNumber
LEFT JOIN Ticket t ON t.flightCode = f.flightNum AND t.status = 'Booked'
GROUP BY f.flightNum, f.departingPort, f.arrivingPort, f.distance, a.numSeats
ORDER BY estimatedSpillCost DESC;*/

CREATE OR REPLACE VIEW vw_revenue_leakage_spill AS
SELECT
    f.departingPort,
    f.arrivingPort,
    SUM(a.numSeats) AS capacity,
    COUNT(t.ticketCode) AS bookedPassengers,
    ROUND(COUNT(t.ticketCode) * 100.0 / NULLIF(SUM(a.numSeats), 0), 2) AS loadFactorPct,
    ROUND(COALESCE(SUM(t.price), 0), 2) AS totalRevenue,
    ROUND(COALESCE(SUM(t.price), 0) / NULLIF(SUM(a.numSeats) * AVG(f.distance), 0), 4) AS RASK,
    ROUND((
        SELECT COALESCE(SUM(t2.price), 0) / NULLIF(SUM(a2.numSeats * f2.distance), 0)
        FROM Ticket t2
        JOIN Flight f2 ON t2.flightCode = f2.flightNum
        JOIN Aircraft a2 ON f2.aircraftUsed = a2.tailNumber
        WHERE t2.status = 'Booked'
    ), 4) AS networkAvgRASK,
    CASE
        WHEN ROUND(COUNT(t.ticketCode) * 100.0 / NULLIF(SUM(a.numSeats), 0), 2) >= 95
            THEN ROUND(SUM(a.numSeats) * 0.10 * COALESCE(AVG(t.price), 0), 2)
        ELSE 0
    END AS estimatedSpillCost,
    CASE
        WHEN ROUND(COUNT(t.ticketCode) * 100.0 / NULLIF(SUM(a.numSeats), 0), 2) >= 95
            THEN CEIL(SUM(a.numSeats) * 1.10)
        ELSE COUNT(t.ticketCode)
    END AS unconstrainedDemandEstimate
FROM Flight f
JOIN Aircraft a ON f.aircraftUsed = a.tailNumber
LEFT JOIN Ticket t ON t.flightCode = f.flightNum AND t.status = 'Booked'
GROUP BY f.departingPort, f.arrivingPort
ORDER BY estimatedSpillCost DESC;