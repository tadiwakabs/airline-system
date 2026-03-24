using AirlineAPI.Data;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Http.HttpResults;
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
        public async Task<ActionResult<Flight>> GetFlightbyId(int id)
        {
            //searching for row with the ID given above
            var flight = await _context.Flights.FindAsync(id);

            if (flight == null)
            {
                return NotFound(new { message = "Flight not found" });
            }

            return Ok(flight);
        }

        // POST: api/flights
        [HttpPost]
        public async Task<IActionResult> CreateFlight([FromBody] Flight newFlight)
        {
            if (newFlight == null)
            {
                return BadRequest("Flight data is missing!");
            }

            _context.Flights.Add(newFlight);

            await _context.SaveChangesAsync();

            return Ok(newFlight);
        }

        // PUT: api/flights/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFlight(int id, [FromBody] Flight updatedFlight)
        {
            if (id!= updatedFlight.flightNum)
            {
                return BadRequest("Id mismatch");
            }

            _context.Entry(updatedFlight).State= EntityState.Modified;
            await _context.SaveChangesAsync();
            return Ok("Flight successfully updated!");
        }

        // DELETE: api/flights/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFlight(int id,[FromBody] Flight deletedFlight)
        {
            var flight= await _context.Flights.FindAsync(id);

            if (flight==null)
            {
                return NotFound("Flight not found.");
            }

            _context.Flights.Remove(flight);
            await _context.SaveChangesAsync();
            return Ok("Flight Deleted");
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchbyDestination([FromQuery] string dest)
        {
            var results= await _context.Flights 
                .Where(f=> f.arrivingPort==dest)
                .ToListAsync();

            return Ok(results);
        }
        
        // POST: api/flights/recurring
        [HttpPost("recurring")]
        public async Task<IActionResult> CreateRecurringFlights(CreateRecurringFlightDto dto)
    }

}

