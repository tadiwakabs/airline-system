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
        public async Task<IActionResult> GetRevenueReport()
        {
            try {
                var data = await _context.Database.SqlQueryRaw<RevenueRow>(
                    "SELECT * FROM vw_financial_revenue").ToListAsync();
                
                var result = data.Select(r => new {
                    r.origin,
                    r.destination,
                    r.passengers,
                    r.totalRevenue,
                    profit = r.totalRevenue, // Profit is just Revenue now
                    r.avgFare,
                    r.cabinDriver
                }).OrderByDescending(x => x.totalRevenue).ToList();

                return Ok(result);
            } catch (Exception ex) { 
                return StatusCode(500, new { message = ex.Message }); 
            }
        }

        [HttpGet("popularity")]
        public async Task<IActionResult> GetPopularity() => 
            Ok(await _context.Database.SqlQueryRaw<PopularityRow>("SELECT * FROM vw_market_popularity").ToListAsync());

        [HttpGet("activity")]
        public async Task<IActionResult> GetActivity() => 
            Ok(await _context.Database.SqlQueryRaw<ActivityRow>("SELECT * FROM vw_operational_activity").ToListAsync());
    }

    public class RevenueRow {
        public string flightNum { get; set; } = "";
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