using AirlineAPI.Data;
using AirlineAPI.Models;
using AirlineAPI.DTOs.Booking;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class BookingController: ControllerBase
    {
        private readonly AppDbContext _context;
        public BookingController(AppDbContext context)
        {
            _context = context;
        }
        
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Booking>>>GetAllBooking()
        {
            var bookings = await _context.Bookings.ToListAsync();
            return Ok(bookings)  ; 
        }
        
        [HttpPost]
        public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
        {
            if (request == null)
                return BadRequest("Booking data is missing");

            var newBooking = new Booking
            {
                bookingId   = Guid.NewGuid().ToString(),
                userId      = request.UserId,
                totalPrice  = request.TotalPrice,
                bookingDate = DateTime.UtcNow,
                bookingStatus = BookingStatus.Pending
            };

            _context.Bookings.Add(newBooking);
            await _context.SaveChangesAsync();

            return Ok(newBooking);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult>ModifyBooking(string id ,[FromBody] Booking modifiedBooking)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking==null)
            {
                return NotFound("Booking not found");
            }
            _context.Entry(modifiedBooking).State=EntityState.Modified;
            await _context.SaveChangesAsync();
            return Ok("Booking Modified!");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelBooking(string id, [FromBody] Booking cancelBooking)
        {
            var book = await _context.Bookings.FindAsync(id);
            if (book==null)
            {
                return NotFound("Booking not found");
            }

            _context.Bookings.Remove(book);
            await _context.SaveChangesAsync();
            return Ok("Booknig Canceled!");
        }

        /*[HttpGet("{id}/payments")]
        public async Task<ActionResult<Booking>>GetBookingHistory(string id)
        {
            var history= await _context.Booking
                .Include(b=>b.)
                .FirstOrDefaultAsync(b=>b.bookingId == id);

            if (history==null)
            {
                return NotFound("No payment history found");
            }
            return Ok(history);
        }*/

    }   

}