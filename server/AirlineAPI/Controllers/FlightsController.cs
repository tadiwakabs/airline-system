using AirlineAPI.Data;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")] //URL: api/flights
    public class FlightsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public FlightsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/flights
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Flight>>> GetFlights()
        {
            var flights = await _context.Flights.ToListAsync();
            return Ok(flights);

        }

        // GET: api/flights/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Flight>> GetFlight(int id)
        {
            var flight = await _context.Flights.FindAsync(id);

            if (flight == null)
            {
                return NotFound(new { message = "Flight not found" });
            }

            return flight;
        }
    }
}

