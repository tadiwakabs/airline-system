using AirlineAPI.Data;
using AirlineAPI.Models;
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
            var bookings = await _context.Booking.ToListAsync();
            return Ok(bookings)  ; 
        }

        [HttpPut("{id}")]
        public async Task<IActionResult>ModifyBooking(string id ,[FromBody] Booking modifiedBooking)
        {
            var booking = await _context.Booking.FindAsync(id);
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
            var book = await _context.Booking.FindAsync(id);
            if (book==null)
            {
                return NotFound("Booking not found");
            }

            _context.Booking.Remove(book);
            await _context.SaveChangesAsync();
            return Ok("Booknig Canceled!");
        }

        [HttpGet("{id}/payments")]
        public async Task<ActionResult<Booking>>GetBookingHistory(string id)
        {
            var history= await _context.Booking
                .Include(b=>b.Payments)
                .FirstOrDefaultAsync(b=>b.bookingId == id);

            if (history==null)
            {
                return NotFound("No payment history found");
            }
            return Ok(history);
        }

    }   

}