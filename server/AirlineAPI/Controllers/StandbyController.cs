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

            var existingStandby = await _context.Standby.FirstOrDefaultAsync(s =>
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

            return Ok(new { message = "Joined standby successfully.", standby = request });
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
                return NotFound("Standby offer not found.");

            if (standby.passengerId != passenger.PassengerId)
                return Forbid();

            if (standby.standbyStatus != "Offered")
                return BadRequest("This standby offer is not available to accept.");

            if (standby.offerExpiresAt.HasValue && standby.offerExpiresAt.Value <= DateTime.UtcNow)
                return BadRequest("This standby offer has expired.");

            standby.standbyStatus = "Accepted";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Standby offer accepted successfully.", standby });
        }
    }
}