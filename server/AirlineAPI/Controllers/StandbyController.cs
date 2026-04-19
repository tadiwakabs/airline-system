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

    var flight = await _context.Flights
        .FirstOrDefaultAsync(f => f.flightNum == standby.flightNum);

    if (flight == null)
        return NotFound(new { message = "Flight not found." });

    var seat = await _context.Seating
        .FirstOrDefaultAsync(se =>
            se.flightNum == standby.flightNum &&
            se.seatStatus == SeatStatus.Available);

    if (seat == null)
        return NotFound(new { message = "No available seat found for this standby offer." });

    seat.seatStatus = SeatStatus.Reserved;
    seat.passengerId = standby.passengerId;
    seat.holdExpiresAt = DateTime.UtcNow.AddMinutes(30);

    standby.standbyStatus = "Accepted";
    standby.offerExpiresAt = null;

    await _context.SaveChangesAsync();
    var standbyPrice = _context.FlightPricing
    .Where(fp => fp.FlightNum == standby.flightNum && fp.CabinClass == CabinClass.Economy)
    .Select(fp => fp.Price)
    .FirstOrDefault();

    if (standbyPrice <= 0)
    standbyPrice = 100m;

    return Ok(new
    {
        message = "Standby offer accepted. Continue booking.",
        flightNum = standby.flightNum,
        seatNumber = seat.seatNumber,
        passengerId = standby.passengerId,
        origin = flight.departingPort,
        destination = flight.arrivingPort,
        totalPrice = standbyPrice
    });
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