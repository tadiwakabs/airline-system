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
                return BadRequest("Booking data is missing.");

            if (!request.Tickets.Any())
                return BadRequest("At least one ticket is required.");

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 1. Create the booking
                var booking = new Booking
                {
                    bookingId     = Guid.NewGuid().ToString(),
                    userId        = request.UserId,
                    totalPrice    = request.TotalPrice,
                    bookingDate   = DateTime.UtcNow,
                    bookingStatus = BookingStatus.Pending
                };
                _context.Bookings.Add(booking);
                await _context.SaveChangesAsync();

                // 2. Create payment
                var payment = new Payment
                {
                    userId        = request.UserId,
                    bookingId     = booking.bookingId,
                    bookingPrice  = (double)request.TotalPrice,
                    totalPrice    = (double)request.TotalPrice,
                    paymentMethod = request.PaymentMethod,
                    paymentStatus = PaymentStatus.Sucess
                };
                _context.Payments.Add(payment);
                await _context.SaveChangesAsync();

                // 3. Create tickets + mark seats as Occupied
                var cabinClass = ParseCabinClass(request.CabinClass);
                var createdTickets = new List<TicketConfirmationDto>();

                foreach (var t in request.Tickets)
                {
                    // Verify seat is still reserved (not grabbed by someone else)
                    var seat = await _context.Seating
                        .FirstOrDefaultAsync(s => s.flightNum == t.FlightNum && s.seatNumber == t.SeatNumber);

                    if (seat == null)
                        return BadRequest($"Seat {t.SeatNumber} on flight {t.FlightNum} not found.");

                    if (seat.seatStatus == SeatStatus.Occupied)
                        return BadRequest($"Seat {t.SeatNumber} on flight {t.FlightNum} is already occupied.");

                    // Generate a deterministic, readable ticket code
                    var shortBooking = booking.bookingId.Replace("-", "")[..8].ToUpper();
                    var ticketCode = $"{shortBooking}-{t.FlightNum}-{t.SeatNumber}-{Guid.NewGuid().ToString()[..4].ToUpper()}";

                    var ticket = new Ticket
                    {
                        ticketCode    = ticketCode,
                        bookingId     = booking.bookingId,
                        flightCode    = t.FlightNum,
                        passengerId   = t.PassengerId,
                        seatNumber    = t.SeatNumber,
                        price         = t.Price,
                        origin        = t.Origin,
                        destination   = t.Destination,
                        boardingTime  = t.BoardingTime,
                        issueDate     = DateTime.UtcNow,
                        reservationTime = DateTime.UtcNow,
                        status        = TicketStatus.Booked,
                        ticketClass   = cabinClass,
                    };

                    _context.Ticket.Add(ticket);

                    // Promote seat from Reserved → Occupied
                    seat.seatStatus = SeatStatus.Occupied;

                    createdTickets.Add(new TicketConfirmationDto
                    {
                        TicketCode   = ticketCode,
                        FlightNum    = t.FlightNum,
                        Origin       = t.Origin,
                        Destination  = t.Destination,
                        SeatNumber   = t.SeatNumber,
                        BoardingTime = t.BoardingTime,
                        Price        = t.Price,
                        PassengerId  = t.PassengerId,
                    });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new BookingConfirmationDto
                {
                    BookingId     = booking.bookingId,
                    TransactionId = payment.transactionId,
                    Tickets       = createdTickets,
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine("Booking error: " + ex.Message);
                return StatusCode(500, new { message = "Booking failed. No charges were made." });
            }
        }

        private static TicketClass ParseCabinClass(string cabinClass) =>
            cabinClass?.ToLower() switch
            {
                "business" => TicketClass.Business,
                "first"    => TicketClass.First,
                _          => TicketClass.Economy,
            };

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
        
        [HttpGet("{bookingId}/flights")]
        public async Task<IActionResult> GetFlightsByBooking(string bookingId)
        {
            var bookingExists = await _context.Bookings.AnyAsync(b => b.bookingId == bookingId);
            if (!bookingExists)
                return NotFound("Booking not found.");

            var flights = await _context.Ticket
                .Where(t => t.bookingId == bookingId)
                .Include(t => t.Flight)
                .Where(t => t.Flight != null)
                .Select(t => t.Flight)
                .Distinct()
                .OrderBy(f => f!.departTime)
                .ToListAsync();
            
            return Ok(flights);
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