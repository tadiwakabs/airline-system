using AirlineAPI.Data;
using AirlineAPI.DTOs.Seating;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeatingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SeatingController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("flight/{flightNum}")]
        public async Task<IActionResult> GetSeatsForFlight(int flightNum)
        {
            var flightExists = await _context.Flights.AnyAsync(f => f.flightNum == flightNum);
            if (!flightExists)
                return NotFound("Flight not found.");

            var now = DateTime.UtcNow;

            // Expire old holds
            var expiredSeats = await _context.Seating
                .Where(s =>
                    s.flightNum == flightNum &&
                    s.seatStatus == SeatStatus.Reserved &&
                    s.holdExpiresAt != null &&
                    s.holdExpiresAt < now)
                .ToListAsync();

            if (expiredSeats.Any())
            {
                foreach (var seat in expiredSeats)
                {
                    seat.seatStatus = SeatStatus.Available;
                    seat.passengerId = null;
                    seat.holdExpiresAt = null;
                    seat.ticketCode = null;
                }

                await _context.SaveChangesAsync();
            }

            var seats = await _context.Seating
                .Where(s => s.flightNum == flightNum)
                .OrderBy(s => s.seatNumber)
                .Select(s => new
                {
                    s.flightNum,
                    s.seatNumber,
                    s.seatclass,
                    s.seatStatus,
                    s.passengerId,
                    s.holdExpiresAt
                })
                .ToListAsync();

            return Ok(seats);
        }

        [HttpPost("reserve")]
        public async Task<IActionResult> ReserveSeat([FromBody] SeatReserveRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.SeatNumber))
                return BadRequest("Seat number is required.");

            if (string.IsNullOrWhiteSpace(request.PassengerId))
                return BadRequest("PassengerId is required.");

            var seat = await _context.Seating
                .FirstOrDefaultAsync(s =>
                    s.flightNum == request.FlightNum &&
                    s.seatNumber == request.SeatNumber);

            if (seat == null)
                return NotFound("Seat not found.");

            var passenger = await _context.Passenger
                .FirstOrDefaultAsync(p => p.PassengerId == request.PassengerId);

            if (passenger == null)
                return NotFound("Passenger not found.");

            // expire stale hold before checking status
            if (seat.seatStatus == SeatStatus.Reserved &&
                seat.holdExpiresAt != null &&
                seat.holdExpiresAt < DateTime.UtcNow)
            {
                seat.seatStatus = SeatStatus.Available;
                seat.passengerId = null;
                seat.holdExpiresAt = null;
                seat.ticketCode = null;
            }

            if (seat.seatStatus == SeatStatus.Occupied)
                return Conflict("Seat is already occupied.");

            if (seat.seatStatus == SeatStatus.Reserved && seat.passengerId != request.PassengerId)
                return Conflict("Seat is already reserved.");

            // cabin restriction
            if (seat.seatclass != null &&
                !string.Equals(seat.seatclass.ToString(), request.CabinClass, StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Passenger can only choose seats in their selected cabin class.");
            }

            // release any previous hold for this passenger on this same flight
            var existingHeldSeat = await _context.Seating
                .FirstOrDefaultAsync(s =>
                    s.flightNum == request.FlightNum &&
                    s.passengerId == request.PassengerId &&
                    s.seatStatus == SeatStatus.Reserved &&
                    s.seatNumber != request.SeatNumber);

            if (existingHeldSeat != null)
            {
                existingHeldSeat.seatStatus = SeatStatus.Available;
                existingHeldSeat.passengerId = null;
                existingHeldSeat.holdExpiresAt = null;
                existingHeldSeat.ticketCode = null;
            }

            seat.seatStatus = SeatStatus.Reserved;
            seat.passengerId = request.PassengerId;
            seat.holdExpiresAt = DateTime.UtcNow.AddMinutes(15);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Seat reserved successfully.",
                seat.flightNum,
                seat.seatNumber,
                seat.seatclass,
                seat.seatStatus,
                seat.passengerId,
                seat.holdExpiresAt
            });
        }

        [HttpPost("release")]
        public async Task<IActionResult> ReleaseSeat([FromBody] SeatReleaseRequest request)
        {
            var seat = await _context.Seating
                .FirstOrDefaultAsync(s =>
                    s.flightNum == request.FlightNum &&
                    s.seatNumber == request.SeatNumber);

            if (seat == null)
                return NotFound("Seat not found.");

            if (seat.passengerId != request.PassengerId)
                return BadRequest("This seat is not reserved by that passenger.");

            if (seat.seatStatus == SeatStatus.Occupied)
                return BadRequest("Occupied seats cannot be manually released.");

            seat.seatStatus = SeatStatus.Available;
            seat.passengerId = null;
            seat.holdExpiresAt = null;
            seat.ticketCode = null;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Seat released successfully." });
        }

        [HttpPost("finalize")]
        public async Task<IActionResult> FinalizeSeat([FromBody] SeatFinalizeRequest request)
        {
            var seat = await _context.Seating
                .FirstOrDefaultAsync(s =>
                    s.flightNum == request.FlightNum &&
                    s.seatNumber == request.SeatNumber);

            if (seat == null)
                return NotFound("Seat not found.");

            if (seat.passengerId != request.PassengerId)
                return BadRequest("This seat is not reserved by that passenger.");

            if (seat.seatStatus == SeatStatus.Occupied)
                return Conflict("Seat is already occupied.");

            seat.seatStatus = SeatStatus.Occupied;
            seat.holdExpiresAt = null;
            seat.ticketCode = request.TicketCode;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Seat finalized successfully.",
                seat.flightNum,
                seat.seatNumber,
                seat.seatStatus,
                seat.passengerId,
                seat.ticketCode
            });
        }
    }
}
