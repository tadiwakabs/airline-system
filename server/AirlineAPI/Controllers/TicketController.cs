using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AirlineAPI.Models;
using AirlineAPI.Data;

namespace AirlineAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TicketController : ControllerBase
    {
        private readonly AppDbContext _context;
        public TicketController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Ticket>>> GetTicket()
        {
            var ticket = await _context.Ticket.ToListAsync();
            return Ok(ticket);
        }

        [HttpPost]
        public async Task<IActionResult> AddTicket([FromBody] Ticket newTicket)
        {
            if (newTicket == null)
            {
                return BadRequest("Missing data for new ticket.");
            }

            _context.Ticket.Add(newTicket);

            await _context.SaveChangesAsync();

            return Ok(newTicket);
        }

        [HttpDelete("{ticketCode}")]
        public async Task<IActionResult> DeleteTicket(string ticketCode, [FromBody] Ticket deletedTicket)
        {
            var ticket = await _context.Ticket.FindAsync(ticketCode);

            if (ticket == null)
            {
                return NotFound("Ticket not found.");
            }

            _context.Ticket.Remove(ticket);
            await _context.SaveChangesAsync();
            return Ok("Ticket successfully deleted");
        }

        [HttpPut("{ticketCode}")]
        public async Task<IActionResult> ModifyTicket(string ticketCode, Ticket updatedTicket)
        {
            var existingTicket = await _context.Ticket.FindAsync(ticketCode);

            if (existingTicket == null)
            {
                return NotFound("Ticket not found.");
            }

            existingTicket.bookingId = updatedTicket.bookingId;
            existingTicket.price = updatedTicket.price;
            existingTicket.issueDate = updatedTicket.issueDate;
            existingTicket.origin = updatedTicket.origin;
            existingTicket.destination = updatedTicket.destination;
            existingTicket.boardingTIme = updatedTicket.boardingTIme;
            existingTicket.seatNumber = updatedTicket.seatNumber;
            existingTicket.flightCode = updatedTicket.flightCode;
            existingTicket.status = updatedTicket.status;
            existingTicket.ticketClass = updatedTicket.ticketClass;
            existingTicket.passengerId = updatedTicket.passengerId;
            existingTicket.reservationTIme = updatedTicket.reservationTIme;
            existingTicket.datetime = updatedTicket.datetime;

            await _context.SaveChangesAsync();
            
            return Ok(existingTicket);
        }
    }
}