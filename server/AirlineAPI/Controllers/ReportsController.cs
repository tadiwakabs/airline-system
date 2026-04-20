using AirlineAPI.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Cors;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [EnableCors("ReactPolicy")]
    [AllowAnonymous]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ReportsController(AppDbContext context) { _context = context; }

        [HttpGet("revenue")]
        public async Task<IActionResult> GetRevenueReport([FromQuery] string? startDate, [FromQuery] string? endDate)
        {
            try {
                var sql = @"
                    SELECT 
                        f.departingPort AS origin,
                        f.arrivingPort AS destination,
                        ROUND(COALESCE(SUM(t.price), 0), 2) AS totalRevenue,
                        ROUND(COALESCE(SUM(COALESCE(p.refundAmount, 0) + COALESCE(p.reimbursementAmount, 0)), 0), 2) AS refunds,
                        ROUND(COALESCE(SUM(t.price), 0) - COALESCE(SUM(COALESCE(p.refundAmount, 0) + COALESCE(p.reimbursementAmount, 0)), 0), 2) AS profit,
                        ROUND(COALESCE(AVG(t.price), 0), 2) AS avgFare,
                        IF(SUM(CASE WHEN t.ticketClass IN ('Business', 'First') THEN t.price ELSE 0 END) > SUM(CASE WHEN t.ticketClass = 'Economy' THEN t.price ELSE 0 END), 'Premium', 'Economy') AS cabinDriver
                    FROM Flight f
                    LEFT JOIN Ticket t ON t.flightCode = f.flightNum
                    LEFT JOIN Payment p ON p.bookingId = t.bookingId
                    WHERE (t.issueDate >= {0} OR {0} IS NULL) AND (t.issueDate <= {1} OR {1} IS NULL)
                    GROUP BY f.departingPort, f.arrivingPort
                    ORDER BY totalRevenue DESC";

                var data = await _context.Database.SqlQueryRaw<RevenueRow>(sql, startDate, endDate).ToListAsync();
                return Ok(data);
            } catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }

        [HttpGet("popularity")]
        public async Task<IActionResult> GetPopularity([FromQuery] string? startDate, [FromQuery] string? endDate)
        {
            try {
                var sql = @"
                    SELECT 
                        f.arrivingPort AS destination,
                        CAST(COUNT(DISTINCT CASE WHEN t.status = 'Booked' THEN t.ticketCode END) AS SIGNED) AS totalActiveBookings,
                        CAST(COUNT(DISTINCT CASE WHEN t.status = 'Booked' THEN t.ticketCode END) / 4 AS SIGNED) AS passengersPerWeek,
                        ROUND(COALESCE(SUM(CASE WHEN t.status = 'Booked' THEN t.price ELSE 0 END), 0) / NULLIF((SELECT SUM(t2.price) FROM Ticket t2 WHERE t2.status = 'Booked'), 0) * 100, 2) AS revenueContributionPercent,
                        COALESCE((SELECT MONTHNAME(MIN(t3.issueDate)) FROM Ticket t3 JOIN Flight f3 ON f3.flightNum = t3.flightCode WHERE f3.arrivingPort = f.arrivingPort AND t3.status = 'Booked' GROUP BY MONTH(t3.issueDate) ORDER BY COUNT(*) DESC LIMIT 1), 'N/A') AS peakMonth,
                        COALESCE((SELECT DAYNAME(MIN(f4.departTime)) FROM Flight f4 JOIN Ticket t4 ON t4.flightCode = f4.flightNum WHERE f4.arrivingPort = f.arrivingPort AND t4.status = 'Booked' GROUP BY DAYOFWEEK(f4.departTime) ORDER BY COUNT(*) DESC LIMIT 1), 'N/A') AS peakDay,
                        ROUND(
                            (
                                COALESCE(SUM(CASE WHEN t.status = 'Booked' THEN t.price ELSE 0 END), 0) / 
                                NULLIF((SELECT SUM(t2.price) FROM Ticket t2 WHERE t2.status = 'Booked'), 0) * 100 * 0.6
                            ) + (
                                COUNT(DISTINCT CASE WHEN t.status = 'Booked' THEN t.ticketCode END) /
                                NULLIF((SELECT COUNT(*) FROM Ticket t3 WHERE t3.status = 'Booked'), 0) * 100 * 0.4
                            )
                        , 4) AS networkScore,
                        CAST(NULL AS CHAR) AS marketTier
                    FROM Flight f
                    LEFT JOIN Ticket t ON t.flightCode = f.flightNum
                    WHERE (t.issueDate >= {0} OR {0} IS NULL) AND (t.issueDate <= {1} OR {1} IS NULL)
                    GROUP BY f.arrivingPort
                    ORDER BY totalActiveBookings DESC";
        
                var data = await _context.Database.SqlQueryRaw<PopularityRow>(sql, startDate, endDate).ToListAsync();
                var sorted = data.OrderByDescending(r => r.networkScore).ToList();
                double totalRevShare = sorted.Sum(r => r.revenueContributionPercent);
                double cumulative = 0;
                double primaryThreshold = totalRevShare * 0.75;
                double avgPaxPerWeek = sorted.Where(r => r.passengersPerWeek > 0).Average(r => (double)r.passengersPerWeek);
                
                foreach (var row in sorted)
                {
                    double prevCumulative = cumulative;
                    cumulative += row.revenueContributionPercent;
                    
                    if (prevCumulative < primaryThreshold && row.passengersPerWeek >= avgPaxPerWeek)
                        row.marketTier = "Primary";
                    else if (row.networkScore > 0)
                        row.marketTier = "Secondary";
                    else
                        row.marketTier = "Inactive";
                }
                
                return Ok(sorted);
            } catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }

        [HttpGet("heatmap")]
        public async Task<IActionResult> GetHeatmap()
        {
           try {
                var data = await _context.Database.SqlQueryRaw<HeatmapRow>(@"
                    SELECT 
                        DAYOFWEEK(MIN(f.departTime)) - 1 AS dayOfWeek,
                        WEEK(MIN(f.departTime), 1) - WEEK(DATE_SUB(MIN(f.departTime), INTERVAL DAYOFMONTH(MIN(f.departTime)) - 1 DAY), 1) + 1 AS weekOfMonth,
                        MONTH(MIN(f.departTime)) AS month,
                        YEAR(MIN(f.departTime)) AS year,
                        CAST(COUNT(DISTINCT CASE WHEN t.status = 'Booked' THEN t.ticketCode END) AS SIGNED) AS passengers
                    FROM Flight f
                    LEFT JOIN Ticket t ON t.flightCode = f.flightNum
                    GROUP BY 
                        YEAR(f.departTime),
                        MONTH(f.departTime),
                        WEEK(f.departTime, 1),
                        DAYOFWEEK(f.departTime)
                    ORDER BY year, month, weekOfMonth, dayOfWeek").ToListAsync();
                return Ok(data);
            } catch (Exception ex) {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("activity")]
public async Task<IActionResult> GetActivity([FromQuery] string? startDate, [FromQuery] string? endDate)
{
    try {
        var sql = @"
            SELECT 
                f.departingPort AS origin,
                f.arrivingPort AS destination,
                f.aircraftUsed AS tailNumber,
                COALESCE(a.planeType, f.aircraftUsed) AS planeModel,
                CAST(ROUND(
                    COUNT(DISTINCT f.flightNum) / 
                    NULLIF(COUNT(DISTINCT YEARWEEK(f.departTime, 0)), 0)
                ) AS SIGNED) AS weeklyFrequency,
                ROUND(
                    COALESCE(
                        (SELECT COUNT(t2.ticketCode) 
                         FROM Ticket t2 
                         JOIN Flight f2 ON t2.flightCode = f2.flightNum
                         WHERE f2.departingPort = f.departingPort 
                           AND f2.arrivingPort = f.arrivingPort
                           AND f2.aircraftUsed = f.aircraftUsed
                           AND t2.status = 'Booked'
                           AND f2.departTime >= NOW() 
                           AND f2.departTime <= DATE_ADD(NOW(), INTERVAL 30 DAY)
                        ), 0
                    ) /
                    NULLIF(
                        (SELECT COUNT(DISTINCT f3.flightNum) * AVG(a3.numSeats)
                         FROM Flight f3
                         JOIN Aircraft a3 ON f3.aircraftUsed = a3.tailNumber
                         WHERE f3.departingPort = f.departingPort
                           AND f3.arrivingPort = f.arrivingPort
                           AND f3.aircraftUsed = f.aircraftUsed
                           AND f3.departTime >= NOW()
                           AND f3.departTime <= DATE_ADD(NOW(), INTERVAL 30 DAY)
                        ), 0
                    ) * 100
                , 2) AS avgLoadFactorPercent,
                CASE
                    WHEN ROUND(
                        COALESCE(
                            (SELECT COUNT(t2.ticketCode) 
                             FROM Ticket t2 
                             JOIN Flight f2 ON t2.flightCode = f2.flightNum
                             WHERE f2.departingPort = f.departingPort 
                               AND f2.arrivingPort = f.arrivingPort
                               AND f2.aircraftUsed = f.aircraftUsed
                               AND t2.status = 'Booked'
                               AND f2.departTime >= NOW() 
                               AND f2.departTime <= DATE_ADD(NOW(), INTERVAL 30 DAY)
                            ), 0
                        ) /
                        NULLIF(
                            (SELECT COUNT(DISTINCT f3.flightNum) * AVG(a3.numSeats)
                             FROM Flight f3
                             JOIN Aircraft a3 ON f3.aircraftUsed = a3.tailNumber
                             WHERE f3.departingPort = f.departingPort
                               AND f3.arrivingPort = f.arrivingPort
                               AND f3.aircraftUsed = f.aircraftUsed
                               AND f3.departTime >= NOW()
                               AND f3.departTime <= DATE_ADD(NOW(), INTERVAL 30 DAY)
                            ), 0
                        ) * 100
                    , 2) >= 95 THEN 'Upsize Aircraft'
                    WHEN ROUND(
                        COALESCE(
                            (SELECT COUNT(t2.ticketCode) 
                             FROM Ticket t2 
                             JOIN Flight f2 ON t2.flightCode = f2.flightNum
                             WHERE f2.departingPort = f.departingPort 
                               AND f2.arrivingPort = f.arrivingPort
                               AND f2.aircraftUsed = f.aircraftUsed
                               AND t2.status = 'Booked'
                               AND f2.departTime >= NOW() 
                               AND f2.departTime <= DATE_ADD(NOW(), INTERVAL 30 DAY)
                            ), 0
                        ) /
                        NULLIF(
                            (SELECT COUNT(DISTINCT f3.flightNum) * AVG(a3.numSeats)
                             FROM Flight f3
                             JOIN Aircraft a3 ON f3.aircraftUsed = a3.tailNumber
                             WHERE f3.departingPort = f.departingPort
                               AND f3.arrivingPort = f.arrivingPort
                               AND f3.aircraftUsed = f.aircraftUsed
                               AND f3.departTime >= NOW()
                               AND f3.departTime <= DATE_ADD(NOW(), INTERVAL 30 DAY)
                            ), 0
                        ) * 100
                    , 2) BETWEEN 80 AND 94.99 THEN 'Optimal'
                    WHEN ROUND(
                        COALESCE(
                            (SELECT COUNT(t2.ticketCode) 
                             FROM Ticket t2 
                             JOIN Flight f2 ON t2.flightCode = f2.flightNum
                             WHERE f2.departingPort = f.departingPort 
                               AND f2.arrivingPort = f.arrivingPort
                               AND f2.aircraftUsed = f.aircraftUsed
                               AND t2.status = 'Booked'
                               AND f2.departTime >= NOW() 
                               AND f2.departTime <= DATE_ADD(NOW(), INTERVAL 30 DAY)
                            ), 0
                        ) /
                        NULLIF(
                            (SELECT COUNT(DISTINCT f3.flightNum) * AVG(a3.numSeats)
                             FROM Flight f3
                             JOIN Aircraft a3 ON f3.aircraftUsed = a3.tailNumber
                             WHERE f3.departingPort = f.departingPort
                               AND f3.arrivingPort = f.arrivingPort
                               AND f3.aircraftUsed = f.aircraftUsed
                               AND f3.departTime >= NOW()
                               AND f3.departTime <= DATE_ADD(NOW(), INTERVAL 30 DAY)
                            ), 0
                        ) * 100
                    , 2) BETWEEN 70 AND 79.99 THEN 'Monitor'
                    ELSE 'Downsize Aircraft'
                END AS recommendedAction
            FROM Flight f
            LEFT JOIN Aircraft a ON f.aircraftUsed = a.tailNumber
            LEFT JOIN (
                SELECT flightCode, COUNT(ticketCode) AS passengers
                FROM Ticket
                WHERE status = 'Booked'
                GROUP BY flightCode
            ) t ON t.flightCode = f.flightNum
            WHERE (f.departTime >= {0} OR {0} IS NULL) AND (f.departTime <= {1} OR {1} IS NULL)
            GROUP BY f.departingPort, f.arrivingPort, f.aircraftUsed, a.planeType
            ORDER BY avgLoadFactorPercent DESC";

        var data = await _context.Database.SqlQueryRaw<ActivityRow>(sql, startDate, endDate).ToListAsync();
        return Ok(data);
    } catch (Exception ex) {
        return StatusCode(500, new { message = ex.Message });
    }
}
    }

    public class RevenueRow {
        public string origin { get; set; } = "";
        public string destination { get; set; } = "";
        public decimal totalRevenue { get; set; }
        public double refunds { get; set; }
        public decimal profit { get; set; }
        public decimal avgFare { get; set; }
        public string cabinDriver { get; set; } = "";
    }

    public class PopularityRow {
        public string destination { get; set; } = "";
        public long totalActiveBookings { get; set; }
        public long passengersPerWeek { get; set; }
        public double revenueContributionPercent { get; set; }
        public string peakMonth { get; set; } = "";
        public string peakDay { get; set; } = "";
        public double networkScore { get; set; }
        public string? marketTier { get; set; }
    }

    public class HeatmapRow {
        public int dayOfWeek { get; set; }
        public int weekOfMonth { get; set; }
        public int month { get; set; }
        public int year { get; set; }
        public long passengers { get; set; }
    }

    public class ActivityRow {
        public string origin { get; set; } = "";
        public string destination { get; set; } = "";
        public string tailNumber { get; set; } = "";
        public string planeModel { get; set; } = "";
        public long weeklyFrequency { get; set; }
        public double? avgLoadFactorPercent { get; set; }
        public string recommendedAction { get; set; } = "";
    }
}