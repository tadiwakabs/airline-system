using AirlineAPI.Data;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/booking")]
    public class BookingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BookingController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] Booking newBooking)
        {
            if (newBooking == null)
                return BadRequest("Booking data is missing");

            // Generate real bookingId
            newBooking.bookingId = $"BK-{Guid.NewGuid()}";
            newBooking.bookingDate = DateTime.UtcNow;
            newBooking.bookingStatus = BookingStatus.Pending;

            _context.Bookings.Add(newBooking);
            await _context.SaveChangesAsync();

            return Ok(newBooking);
        }
    }
}