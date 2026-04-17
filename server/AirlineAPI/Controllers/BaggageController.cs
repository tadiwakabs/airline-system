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

        [HttpGet("{id}")]
        public async Task<ActionResult<Baggage>> GetBaggage(string id)
        {
            var baggage = await _context.Baggage.FindAsync(id);

            if (baggage == null)
            {
                return NotFound();
            }
            return Ok(baggage);
        }

        [HttpGet("ticket/{ticketCode}")]
        public async Task<ActionResult<IEnumerable<Baggage>>> GetBaggageByFlight(string ticketCode)
        {
            var flightBaggage = await _context.Baggage
                .Where(b => b.ticketCode == ticketCode)
                .ToListAsync();

            return Ok(flightBaggage);
        }

        [HttpPost("bulk")]
        public async Task<IActionResult> PostBaggageBulk([FromBody] List<Baggage> baggageList)
        {
            foreach (var baggage in baggageList)
            {       
                if (string.IsNullOrEmpty(baggage.baggageID))
                {
                    baggage.baggageID = Guid.NewGuid().ToString().Substring(0, 30);
                }
                _context.Baggage.Add(baggage);
            }
            await _context.SaveChangesAsync();
            return Ok(new { message = "Baggage added successfully" });
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

            return CreatedAtAction(nameof(GetBaggage), new { id = baggage.baggageID }, baggage);
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