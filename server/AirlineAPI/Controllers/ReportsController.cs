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
        public async Task<IActionResult> GetRevenueReport([FromQuery] DateTime? start, [FromQuery] DateTime? end)
        {
            var sql = @"
                SELECT 
                    f.departingPort AS origin, 
                    f.arrivingPort AS destination, 
                    CAST(COUNT(t.ticketCode) AS SIGNED) AS passengers,
                    COALESCE(SUM(t.price), 0) AS totalRevenue,
                    COALESCE(AVG(t.price), 0) AS avgFare,
                    IF(
                        SUM(CASE WHEN t.ticketClass IN ('Business', 'First') THEN t.price ELSE 0 END) > 
                        SUM(CASE WHEN t.ticketClass = 'Economy' THEN t.price ELSE 0 END), 
                        'Premium', 'Economy'
                    ) AS cabinDriver
                FROM Flight f
                LEFT JOIN Ticket t ON t.flightCode = f.flightNum AND t.status = 'Booked'
                WHERE (f.departTime >= {0} OR {0} IS NULL)
                  AND (f.departTime <= {1} OR {1} IS NULL)
                GROUP BY f.departingPort, f.arrivingPort";

            try {
                var raw = await _context.Database.SqlQueryRaw<RevenueRow>(sql, start, end).ToListAsync();
                return Ok(raw.OrderByDescending(r => r.totalRevenue).ToList());
            } catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }

        [HttpGet("popularity")]
        public async Task<IActionResult> GetPopularity([FromQuery] DateTime? start, [FromQuery] DateTime? end)
        {
            var sql = @"
                SELECT 
                    f.arrivingPort AS destination, 
                    COUNT(CASE WHEN t.status = 'Booked' THEN 1 END) AS totalActiveBookings,
                    CAST(ROUND(COUNT(CASE WHEN t.status = 'Booked' THEN 1 END) / 
                        NULLIF(COUNT(DISTINCT DAYNAME(f.departTime)), 0)) AS SIGNED) AS passengersPerWeek,
                    ROUND((SUM(CASE WHEN t.status = 'Booked' THEN t.price ELSE 0 END) / 
                          NULLIF((SELECT SUM(price) FROM Ticket WHERE status = 'Booked'), 0)) * 100, 2) AS revenueContributionPercent,
                    COALESCE((SELECT MONTHNAME(f2.departTime) 
                     FROM Flight f2 
                     JOIN Ticket t2 ON t2.flightCode = f2.flightNum 
                     WHERE f2.arrivingPort = f.arrivingPort AND t2.status = 'Booked'
                     GROUP BY MONTHNAME(f2.departTime) 
                     ORDER BY COUNT(t2.ticketCode) DESC LIMIT 1), 'N/A') AS peakMonth,
                    COALESCE((SELECT DAYNAME(f3.departTime) 
                     FROM Flight f3 
                     JOIN Ticket t3 ON t3.flightCode = f3.flightNum 
                     WHERE f3.arrivingPort = f.arrivingPort AND t3.status = 'Booked'
                     GROUP BY DAYNAME(f3.departTime) 
                     ORDER BY COUNT(t3.ticketCode) DESC LIMIT 1), 'N/A') AS peakDay
                FROM Flight f
                LEFT JOIN Ticket t ON t.flightCode = f.flightNum
                WHERE (f.departTime >= {0} OR {0} IS NULL)
                  AND (f.departTime <= {1} OR {1} IS NULL)
                GROUP BY f.arrivingPort
                ORDER BY totalActiveBookings DESC";

            try {
                var data = await _context.Database.SqlQueryRaw<PopularityRow>(sql, start, end).ToListAsync();
                return Ok(data);
            } catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }

        [HttpGet("activity")]
        public async Task<IActionResult> GetActivity([FromQuery] DateTime? start, [FromQuery] DateTime? end)
        {
            var sql = @"
                SELECT 
                    f.departingPort AS origin, 
                    f.arrivingPort AS destination, 
                    MAX(a.tailNumber) AS tailNumber,
                    MAX(a.planeType) AS planeModel,
                    CAST(COUNT(DISTINCT DAYNAME(f.departTime)) AS SIGNED) AS weeklyFrequency,
                    ROUND(AVG(routeData.loadFactor), 1) AS avgLoadFactorPercent
                FROM Flight f
                INNER JOIN Aircraft a ON f.aircraftUsed = a.tailNumber
                INNER JOIN (
                    SELECT 
                        f2.flightNum,
                        (COUNT(t.ticketCode) / NULLIF(a2.numSeats, 0)) * 100 AS loadFactor
                    FROM Flight f2
                    INNER JOIN Aircraft a2 ON f2.aircraftUsed = a2.tailNumber
                    LEFT JOIN Ticket t ON t.flightCode = f2.flightNum AND t.status = 'Booked'
                    WHERE (f2.departTime >= {0} OR {0} IS NULL)
                      AND (f2.departTime <= {1} OR {1} IS NULL)
                    GROUP BY f2.flightNum, a2.numSeats
                ) AS routeData ON f.flightNum = routeData.flightNum
                WHERE (f.departTime >= {0} OR {0} IS NULL)
                  AND (f.departTime <= {1} OR {1} IS NULL)
                GROUP BY f.departingPort, f.arrivingPort
                ORDER BY avgLoadFactorPercent DESC";

            try {
                var data = await _context.Database.SqlQueryRaw<ActivityRow>(sql, start, end).ToListAsync();
                return Ok(data);
            } catch (Exception ex) { 
                return StatusCode(500, new { message = "Database Error: " + ex.Message }); 
            }
        }
    }

    public class RevenueRow {
        public string origin { get; set; } = "";
        public string destination { get; set; } = "";
        public int passengers { get; set; }
        public double totalRevenue { get; set; }
        public double avgFare { get; set; }
        public string cabinDriver { get; set; } = "";
    }

    public class PopularityRow {
        public string destination { get; set; } = "";
        public int totalActiveBookings { get; set; }
        public int passengersPerWeek { get; set; }
        public double revenueContributionPercent { get; set; }
        public string peakMonth { get; set; } = "";
        public string peakDay { get; set; } = "";
    }

    public class ActivityRow {
        public string origin { get; set; } = "";
        public string destination { get; set; } = "";
        public string tailNumber { get; set; } = "";
        public string planeModel { get; set; } = "";
        public int weeklyFrequency { get; set; }
        public double avgLoadFactorPercent { get; set; }
    }
}