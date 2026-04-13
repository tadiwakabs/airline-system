using AirlineAPI.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/reports")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/reports/od-demand
        [HttpGet("od-demand")]
        public async Task<IActionResult> GetODDemand()
        {
            var results = await _context.Database
                .SqlQueryRaw<OdDemandRow>("SELECT * FROM vw_od_market_demand LIMIT 100")
                .ToListAsync();
            return Ok(results);
        }

        // GET: api/reports/route-vitality
        [HttpGet("route-vitality")]
        public async Task<IActionResult> GetRouteVitality()
        {
            var results = await _context.Database
                .SqlQueryRaw<RouteVitalityRow>("SELECT * FROM vw_route_vitality_matrix LIMIT 100")
                .ToListAsync();
            return Ok(results);
        }

        // GET: api/reports/revenue-leakage
        [HttpGet("revenue-leakage")]
        public async Task<IActionResult> GetRevenueLeakage()
        {
            var results = await _context.Database
                .SqlQueryRaw<RevenueLeakageRow>("SELECT * FROM vw_revenue_leakage_spill LIMIT 100")
                .ToListAsync();
            return Ok(results);
        }
    }

    public class OdDemandRow
    {
        public string trueOrigin { get; set; } = string.Empty;
        public string trueDestination { get; set; } = string.Empty;
        public int totalPassengers { get; set; }
        public double connectionRatioPct { get; set; }
        public double actualRevenue { get; set; }
        public double potentialDirectRevenue { get; set; }
    }

    public class RouteVitalityRow
    {
        public string departingPort { get; set; } = string.Empty;
        public string arrivingPort { get; set; } = string.Empty;
        public int flightNum { get; set; }
        public int bookedPassengers { get; set; }
        public int totalCapacity { get; set; }
        public double actualLoadFactorPct { get; set; }
        public double avgTicketPrice { get; set; }
        public double passengerYield { get; set; }
        public double breakEvenLoadFactorPct { get; set; }
        public string quadrant { get; set; } = string.Empty;
    }

    public class RevenueLeakageRow
    {
        public int flightNum { get; set; }
        public string departingPort { get; set; } = string.Empty;
        public string arrivingPort { get; set; } = string.Empty;
        public int distance { get; set; }
        public int capacity { get; set; }
        public int bookedPassengers { get; set; }
        public double loadFactorPct { get; set; }
        public double totalRevenue { get; set; }
        public double RASK { get; set; }
        public double networkAvgRASK { get; set; }
        public double estimatedSpillCost { get; set; }
        public int unconstrainedDemandEstimate { get; set; }
    }
}