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
        
        [HttpGet("flight/{flightNum}/passengers")]
        public async Task<ActionResult<IEnumerable<FlightPassengerBaggageDto>>> GetPassengerBaggageForFlight(int flightNum)
        {
            var passengers = await (
                from t in _context.Ticket
                join p in _context.Passenger on t.passengerId equals p.PassengerId
                where t.flightCode == flightNum
                      && t.status != TicketStatus.Cancelled
                select new
                {
                    PassengerId = p.PassengerId,
                    TicketCode = t.ticketCode,
                    SeatNumber = t.seatNumber,
                    FirstName = p.FirstName,
                    LastName = p.LastName,
                    TicketClass = t.ticketClass.HasValue ? t.ticketClass.Value.ToString() : ""
                }
            ).ToListAsync();

            var ticketCodes = passengers
                .Select(x => x.TicketCode)
                .Distinct()
                .ToList();

            var baggage = await _context.Baggage
                .Where(b => b.ticketCode != null && ticketCodes.Contains(b.ticketCode))
                .ToListAsync();

            var result = passengers
                .GroupJoin(
                    baggage,
                    p => p.TicketCode,
                    b => b.ticketCode!,
                    (p, bags) => new FlightPassengerBaggageDto
                    {
                        PassengerId = p.PassengerId,
                        TicketCode = p.TicketCode,
                        SeatNumber = p.SeatNumber,
                        FirstName = p.FirstName,
                        LastName = p.LastName,
                        TicketClass = p.TicketClass,
                        TotalBags = bags.Count(),
                        CheckedBags = bags.Count(x => x.isChecked),
                        UncheckedBags = bags.Count(x => !x.isChecked),
                        AllChecked = bags.Any() && bags.All(x => x.isChecked)
                    }
                )
                .OrderBy(x => x.SeatNumber)
                .ToList();

            return Ok(result);
        }

        [HttpPut("flight/{flightNum}/check-passenger")]
        public async Task<IActionResult> CheckPassengerBagsForFlight(int flightNum, [FromBody] CheckPassengerBagsDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.PassengerId))
                return BadRequest(new { message = "PassengerId is required." });

            var baggageRows = await (
                from b in _context.Baggage
                join t in _context.Ticket on b.ticketCode equals t.ticketCode
                where t.flightCode == flightNum
                      && b.PassengerId == dto.PassengerId
                select b
            ).ToListAsync();

            if (!baggageRows.Any())
                return NotFound(new { message = "No bags found for this passenger on the selected flight." });

            foreach (var bag in baggageRows)
            {
                bag.isChecked = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Bags checked successfully.",
                updated = baggageRows.Count
            });
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
