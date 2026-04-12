using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AirlineAPI.Models;
using AirlineAPI.Data;
using Microsoft.AspNetCore.Authorization;

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

        // ── GET /api/ticket/flight/{flightNum} ────────────────────────────────
        // Returns all non-cancelled tickets for a flight with passenger details.
        // Employee/Administrator only.

        [HttpGet("flight/{flightNum}")]
        [Authorize]
        public async Task<IActionResult> GetPassengersForFlight(int flightNum)
        {
            var flightExists = await _context.Flights.AnyAsync(f => f.flightNum == flightNum);
            if (!flightExists)
                return NotFound(new { message = $"Flight {flightNum} not found." });

            var tickets = await _context.Ticket
                .Where(t => t.flightCode == flightNum && t.status != TicketStatus.Cancelled)
                .Include(t => t.Passenger)
                .OrderBy(t => t.seatNumber)
                .Select(t => new
                {
                    ticketCode  = t.ticketCode,
                    seatNumber  = t.seatNumber,
                    ticketClass = t.ticketClass != null ? t.ticketClass.ToString() : null,
                    status      = t.status != null ? t.status.ToString() : null,
                    passenger   = t.Passenger == null ? null : new
                    {
                        passengerId   = t.Passenger.PassengerId,
                        firstName     = t.Passenger.FirstName,
                        lastName      = t.Passenger.LastName,
                        passengerType = t.Passenger.PassengerType.ToString(),
                        email         = t.Passenger.Email,
                        phoneNumber   = t.Passenger.PhoneNumber,
                    },
                })
                .ToListAsync();

            return Ok(tickets);
        }

        [HttpPost]
        public async Task<IActionResult> AddTicket([FromBody] Ticket newTicket)
        {
            if (newTicket == null)
                return BadRequest("Missing data for new ticket.");

            _context.Ticket.Add(newTicket);
            await _context.SaveChangesAsync();
            return Ok(newTicket);
        }

        [HttpDelete("{ticketCode}")]
        public async Task<IActionResult> DeleteTicket(string ticketCode, [FromBody] Ticket deletedTicket)
        {
            var ticket = await _context.Ticket.FindAsync(ticketCode);
            if (ticket == null)
                return NotFound("Ticket not found.");

            _context.Ticket.Remove(ticket);
            await _context.SaveChangesAsync();
            return Ok("Ticket successfully deleted");
        }

        [HttpPut("{ticketCode}")]
        public async Task<IActionResult> ModifyTicket(string ticketCode, Ticket updatedTicket)
        {
            var existingTicket = await _context.Ticket.FindAsync(ticketCode);
            if (existingTicket == null)
                return NotFound("Ticket not found.");

            existingTicket.bookingId      = updatedTicket.bookingId;
            existingTicket.price          = updatedTicket.price;
            existingTicket.issueDate      = updatedTicket.issueDate;
            existingTicket.origin         = updatedTicket.origin;
            existingTicket.destination    = updatedTicket.destination;
            existingTicket.boardingTime   = updatedTicket.boardingTime;
            existingTicket.seatNumber     = updatedTicket.seatNumber;
            existingTicket.flightCode     = updatedTicket.flightCode;
            existingTicket.status         = updatedTicket.status;
            existingTicket.ticketClass    = updatedTicket.ticketClass;
            existingTicket.passengerId    = updatedTicket.passengerId;
            existingTicket.reservationTime = updatedTicket.reservationTime;

            await _context.SaveChangesAsync();
            return Ok(existingTicket);
        }
    }
}
