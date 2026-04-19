using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AirlineAPI.Models;
using AirlineAPI.Data;
using AirlineAPI.DTOs.Baggage;

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
                return NotFound();

            return Ok(baggage);
        }

        [HttpGet("ticket/{ticketCode}")]
        public async Task<ActionResult<IEnumerable<Baggage>>> GetBaggageByTicket(string ticketCode)
        {
            var baggage = await _context.Baggage
                .Where(b => b.ticketCode == ticketCode)
                .ToListAsync();

            return Ok(baggage);
        }

        [HttpPost("bulk")]
        public async Task<IActionResult> PostBaggageBulk([FromBody] List<CreateBaggageDto> baggageList)
        {
            if (baggageList == null || !baggageList.Any())
                return BadRequest("No baggage provided.");

            var created = new List<Baggage>();

            foreach (var item in baggageList)
            {
                var baggage = new Baggage
                {
                    baggageID = Guid.NewGuid().ToString("N")[..30],
                    PassengerId = item.PassengerId,
                    additionalBaggage = item.AdditionalBaggage,
                    additionalFare = item.AdditionalFare ?? 0,
                    isChecked = false,
                    ticketCode = null
                };

                created.Add(baggage);
            }

            await _context.Baggage.AddRangeAsync(created);
            await _context.SaveChangesAsync();

            return Ok(created.Select(b => new
            {
                baggageId = b.baggageID,
                passengerId = b.PassengerId,
                additionalBaggage = b.additionalBaggage,
                additionalFare = b.additionalFare,
                isChecked = b.isChecked,
                ticketCode = b.ticketCode
            }));
        }

        [HttpPut("attach-tickets")]
        public async Task<IActionResult> AttachTickets([FromBody] List<AttachBaggageTicketDto> updates)
        {
            if (updates == null || !updates.Any())
                return BadRequest("No baggage updates provided.");

            var baggageIds = updates.Select(u => u.BaggageId).Distinct().ToList();

            var baggageRows = await _context.Baggage
                .Where(b => baggageIds.Contains(b.baggageID))
                .ToListAsync();

            foreach (var update in updates)
            {
                var baggage = baggageRows.FirstOrDefault(b => b.baggageID == update.BaggageId);
                if (baggage == null)
                    continue;

                baggage.ticketCode = update.TicketCode;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Baggage updated successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBaggage(string id)
        {
            var baggage = await _context.Baggage.FindAsync(id);
            if (baggage == null)
                return NotFound();

            _context.Baggage.Remove(baggage);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
