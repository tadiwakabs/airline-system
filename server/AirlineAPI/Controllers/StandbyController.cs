using AirlineAPI.Data;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AirlineAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class StandbyController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StandbyController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("me")]
        public async Task<ActionResult> GetMyStandby()
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized("User not authenticated.");

            var passenger = await _context.Passenger
                .FirstOrDefaultAsync(p => p.UserId == currentUserId);

            if (passenger == null)
                return NotFound("Passenger record not found.");

            var standbyRows = await _context.Standby
                .Where(s => s.passengerId == passenger.PassengerId)
                .OrderByDescending(s => s.requestTime)
                .ToListAsync();

            return Ok(standbyRows);
        }

        [HttpPost]
        public async Task<IActionResult> JoinStandby([FromBody] Standby request)
        {
            if (request == null)
                return BadRequest("Standby request is missing.");

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized("User not authenticated.");

            var passenger = await _context.Passenger
                .FirstOrDefaultAsync(p => p.UserId == currentUserId);

            if (passenger == null)
                return NotFound("Passenger record not found.");

            var existingStandby = await _context.Standby
                .FirstOrDefaultAsync(s =>
                    s.flightNum == request.flightNum &&
                    s.passengerId == passenger.PassengerId &&
                    (s.standbyStatus == "Waiting" || s.standbyStatus == "Offered"));

            if (existingStandby != null)
                return BadRequest("You are already on standby for this flight.");

            request.passengerId = passenger.PassengerId;
            request.requestTime = DateTime.UtcNow;
            request.standbyStatus = "Waiting";
            request.offerExpiresAt = null;

            _context.Standby.Add(request);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Joined standby successfully.",
                standby = request
            });
        }

        [HttpPut("{id}/accept")]
public async Task<IActionResult> AcceptStandbyOffer(int id)
{
    try
    {
        var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(currentUserId))
            return Unauthorized("User not authenticated.");

        var passenger = await _context.Passenger
            .FirstOrDefaultAsync(p => p.UserId == currentUserId);

        if (passenger == null)
            return NotFound("Passenger record not found.");

        var standby = await _context.Standby
            .FirstOrDefaultAsync(s => s.standbyId == id);

        if (standby == null)
            return NotFound(new { message = "Standby request not found." });

        if (standby.passengerId != passenger.PassengerId)
            return Forbid();

        if (standby.standbyStatus != "Offered")
            return BadRequest(new { message = "This standby offer is not available to accept." });

        if (standby.offerExpiresAt != null && standby.offerExpiresAt < DateTime.UtcNow)
            return BadRequest(new { message = "Standby offer expired." });

        var ticket = await _context.Ticket
            .FirstOrDefaultAsync(t =>
                t.passengerId == standby.passengerId &&
                t.flightCode == standby.flightNum &&
                t.status == TicketStatus.Pending);

        if (ticket == null)
            return NotFound(new { message = "Pending ticket not found for this standby request." });

        var payment = await _context.Payments
            .FirstOrDefaultAsync(p => p.bookingId == ticket.bookingId);

        if (payment == null)
            return NotFound(new { message = "Pending payment not found for this standby request." });

        standby.standbyStatus = "Accepted";
        standby.offerExpiresAt = null;

        // DO NOT mark ticket booked yet
        // ticket.status = TicketStatus.Booked;   <-- remove this

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Standby offer accepted. Proceed to payment.",
            standbyId = standby.standbyId,
            transactionId = payment.transactionId,
            bookingId = ticket.bookingId,
            flightNum = ticket.flightCode,
            seatNumber = ticket.seatNumber,
            totalPrice = payment.totalPrice
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new
        {
            message = "Failed to accept standby offer.",
            error = ex.Message,
            innerError = ex.InnerException?.Message
        });
    }
}

        [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectStandbyOffer(int id)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized("User not authenticated.");

            var passenger = await _context.Passenger
                .FirstOrDefaultAsync(p => p.UserId == currentUserId);

            if (passenger == null)
                return NotFound("Passenger record not found.");

            var standby = await _context.Standby
                .FirstOrDefaultAsync(s => s.standbyId == id);

            if (standby == null)
                return NotFound("Standby offer not found.");

            if (standby.passengerId != passenger.PassengerId)
                return Forbid();

            if (standby.standbyStatus != "Offered")
                return BadRequest("This standby offer is not available to reject.");

            standby.standbyStatus = "Rejected";
            standby.offerExpiresAt = null;

            var nextStandby = await _context.Standby
                .Where(s => s.flightNum == standby.flightNum && s.standbyStatus == "Waiting")
                .OrderBy(s => s.requestTime)
                .FirstOrDefaultAsync();

            if (nextStandby != null)
            {
                nextStandby.standbyStatus = "Offered";
                nextStandby.offerExpiresAt = DateTime.UtcNow.AddMinutes(30);

                var nextPassenger = await _context.Passenger
                    .FirstOrDefaultAsync(p => p.PassengerId == nextStandby.passengerId);

                if (nextPassenger != null)
                {
                    _context.Notification.Add(new Notification
                    {
                        userId = nextPassenger.UserId,
                        flightNum = nextStandby.flightNum,
                        message = $"A seat is now available on flight {nextStandby.flightNum}. Please accept within 30 minutes.",
                        createdAt = DateTime.UtcNow,
                        notificationStatus = "Unread"
                    });
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Standby offer rejected successfully." });
        }
    }
}