using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AirlineAPI.Models;
using AirlineAPI.Data; // Ensure this matches your actual Data namespace

namespace AirlineAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BaggageController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BaggageController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("flight/{flightId}")]
        public async Task<ActionResult<IEnumerable<Baggage>>> GetBaggageByFlight(string flightId)
        {
            var flightBaggage = await _context.Baggage
                .Include(b => b.Ticket)
                .Where(b => b.Ticket != null && b.Ticket.ticketCode == flightId)
                .ToListAsync();

            if (flightBaggage == null || !flightBaggage.Any())
            {
                return NotFound($"No baggage found for flight: {flightId}");
            }

            return Ok(flightBaggage);
        }

        [HttpPost]
        public async Task<ActionResult<Baggage>> PostBaggage(Baggage baggage)
        {
            if (string.IsNullOrEmpty(baggage.baggageID))
            {
                baggage.baggageID = Guid.NewGuid().ToString().Substring(0, 30);
            }

            _context.Baggage.Add(baggage);
            
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {
                if (BaggageExists(baggage.baggageID))
                {
                    return Conflict("Baggage ID already exists.");
                }
                throw;
            }

            return CreatedAtAction(nameof(GetBaggageByFlight), new { flightId = baggage.ticketCode }, baggage);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBaggage(string id)
        {
            var baggage = await _context.Baggage.FindAsync(id);
            if (baggage == null)
            {
                return NotFound();
            }

            _context.Baggage.Remove(baggage);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool BaggageExists(string id)
        {
            return _context.Baggage.Any(e => e.baggageID == id);
        }
    }
}