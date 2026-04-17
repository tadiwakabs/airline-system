using AirlineAPI.Data;
using AirlineAPI.Models;
using AirlineAPI.DTOs.Booking;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace AirlineAPI.Controllers
{
    [Authorize]
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
                    paymentStatus = PaymentStatus.Success
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
                    
                    if (seat.seatStatus == SeatStatus.Occupied)
                        return BadRequest($"Seat {t.SeatNumber} on flight {t.FlightNum} is already occupied.");

                    // Allow Reserved seats only if held for this passenger
                    if (seat.seatStatus == SeatStatus.Reserved && seat.passengerId != t.PassengerId)
                        return BadRequest($"Seat {t.SeatNumber} on flight {t.FlightNum} is currently reserved by another passenger.");

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


        [HttpGet("myBooking")]
        public async Task<ActionResult> GetMyBookings()
        {
            var currentUserId = User.FindFirst("sub")?.Value
                    ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            var bookings = await _context.Bookings
                .Include(b => b.Tickets)
                .ThenInclude(t => t.Flight)
                .Include(b => b.Tickets)
                .ThenInclude(t => t.Passenger)
                .Where(b => b.userId == currentUserId)
                .OrderByDescending(b => b.Tickets
                    .Select(t => t.Flight != null ? t.Flight.departTime : DateTime.MinValue)
                    .FirstOrDefault())
                .ToListAsync();

            return Ok(bookings);
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

        [HttpPut("{id}/change-seat")]
        public async Task<IActionResult> ModifySeat(string id, [FromBody] string newSeatNumber)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound("Booking not found");

            if (booking.bookingStatus == BookingStatus.Cancelled) 
    {           return BadRequest("Cannot change seats on a cancelled booking.");
    }

            var currentUserId = User.FindFirst("sub")?.Value
                    ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (booking.userId != currentUserId && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var ticket = await _context.Ticket.FirstOrDefaultAsync(t => t.bookingId == booking.bookingId);

            if (ticket == null) 
            return NotFound("No ticket found for this booking.");


            var newSeat = await _context.Seating
                .FirstOrDefaultAsync(s => s.flightNum == ticket.flightCode && s.seatNumber == newSeatNumber);

            if (newSeat == null) return NotFound("Seat not found on this flight.");
            if (newSeat.seatStatus== SeatStatus.Occupied) return BadRequest("Seat already taken.");

            var oldSeat = await _context.Seating
                .FirstOrDefaultAsync(s => s.flightNum == ticket.flightCode && s.seatNumber == ticket.seatNumber);

            if (oldSeat != null)
            {
                oldSeat.seatStatus = SeatStatus.Available;
            }

            ticket.seatNumber = newSeatNumber;
            newSeat.seatStatus = SeatStatus.Occupied;

            await _context.SaveChangesAsync();

            return Ok($"Seat changed successfully to {newSeatNumber}");
        }


        [HttpDelete("{id}/cancel")]
        public async Task<IActionResult> CancelBooking(string id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return NotFound("Booking not found");


            var currentUserId = User.FindFirst("sub")?.Value
                    ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (booking.userId != currentUserId && !User.IsInRole("Admin")) return Forbid();

            var tickets = await _context.Ticket
                .Include(t => t.Flight)
                .Where(t => t.bookingId == booking.bookingId)
                .ToListAsync();

            if (!tickets.Any())
                return BadRequest("No tickets found for this booking.");

            if (tickets.Any(t => t.Flight == null))
                return BadRequest("Flight information not found for one or more tickets.");

            if (tickets.Any(t => t.Flight!.departTime <= DateTime.UtcNow))
            {
                return BadRequest("Cannot cancel a flight that has already departed or is currently in the air.");
            }

            foreach (var ticket in tickets)
            {
                var seat = await _context.Seating
                    .FirstOrDefaultAsync(s => s.flightNum == ticket.flightCode && s.seatNumber == ticket.seatNumber);

                if (seat != null)
                {
                    seat.seatStatus = SeatStatus.Available;
                    seat.passengerId = null;
                    seat.holdExpiresAt = null;
                }
            }

            _context.Ticket.RemoveRange(tickets);

            booking.bookingStatus = BookingStatus.Cancelled;

            await _context.SaveChangesAsync();

            return Ok("Booking successfully cancelled. Tickets deleted and seats released.");
        }

        /// <summary>
        /// Look up flight status by a short booking reference (first 8 chars of the UUID)
        /// or by a plain flight number. No auth required so users can check without logging in.
        /// GET /api/booking/status?ref=565b2bda
        /// GET /api/booking/status?ref=1342
        /// </summary>
        [AllowAnonymous]
        [HttpGet("status")]
        public async Task<IActionResult> GetFlightStatus([FromQuery(Name = "ref")] string reference)
        {
            if (string.IsNullOrWhiteSpace(reference))
                return BadRequest("A booking reference or flight number is required.");

            var query = reference.Trim();

            if (int.TryParse(query, out var flightNum))
            {
                var flight = await _context.Flights
                    .Where(f => f.flightNum == flightNum)
                    .Join(_context.Airports,
                        f => f.departingPort,
                        a => a.airportCode,
                        (f, dep) => new { f, dep })
                    .Join(_context.Airports,
                        x => x.f.arrivingPort,
                        a => a.airportCode,
                        (x, arr) => new { x.f, x.dep, arr })
                    .Select(x => new FlightStatusDto
                    {
                        FlightNum = x.f.flightNum,
                        Status = x.f.status.ToString(),
                        DepartingPort = x.f.departingPort,
                        ArrivingPort = x.f.arrivingPort,
                        DepartingCity = x.dep.city,
                        ArrivingCity = x.arr.city,

                        // local display
                        DepartTime = x.f.scheduledDepartLocal ?? x.f.departTime,
                        ArrivalTime = x.f.scheduledArrivalLocal ?? x.f.arrivalTime,

                        // utc tracker math
                        DepartTimeUtc = x.f.departTime,
                        ArrivalTimeUtc = x.f.arrivalTime,

                        AircraftUsed = x.f.aircraftUsed,
                        BookingId = null,
                    })
                    .FirstOrDefaultAsync();

                if (flight == null)
                    return NotFound("No flight found with that number.");

                return Ok(flight);
            }

            var normalized = query.Replace("-", "").ToLower();
            var prefix = normalized[..Math.Min(8, normalized.Length)];

            var booking = await _context.Bookings
                .Where(b => b.bookingId.Replace("-", "").ToLower().StartsWith(prefix))
                .Include(b => b.Tickets)
                    .ThenInclude(t => t.Flight)
                .OrderByDescending(b => b.bookingDate)
                .FirstOrDefaultAsync();

            if (booking == null)
                return NotFound("No booking found matching that reference.");

            var results = booking.Tickets
                .Where(t => t.Flight != null)
                .GroupBy(t => t.flightCode)
                .Select(g =>
                {
                    var f = g.First().Flight!;
                    var depCity = _context.Airports
                        .Where(a => a.airportCode == f.departingPort)
                        .Select(a => a.city)
                        .FirstOrDefault();
                    var arrCity = _context.Airports
                        .Where(a => a.airportCode == f.arrivingPort)
                        .Select(a => a.city)
                        .FirstOrDefault();
                    
                    return new FlightStatusDto
                    {
                        FlightNum = f.flightNum,
                        Status = f.status.ToString(),
                        DepartingPort = f.departingPort,
                        ArrivingPort = f.arrivingPort,

                        // local display
                        DepartTime = f.scheduledDepartLocal ?? f.departTime,
                        ArrivalTime = f.scheduledArrivalLocal ?? f.arrivalTime,

                        // utc tracker math
                        DepartTimeUtc = f.departTime,
                        ArrivalTimeUtc = f.arrivalTime,

                        BookingId = booking.bookingId,
                        AircraftUsed = f.aircraftUsed,
                        DepartingCity = depCity,
                        ArrivingCity = arrCity,
                    };
                })
                .OrderBy(f => f.DepartTime)
                .ToList();

            return Ok(results);
        }

        /// <summary>
        /// Look up flight status by a short booking reference (first 8 chars of the UUID)
        /// or by a plain flight number. No auth required so users can check without logging in.
        /// GET /api/booking/status?ref=565b2bda
        /// GET /api/booking/status?ref=1342
        /// </summary>
        [AllowAnonymous]
        [HttpGet("status")]
        public async Task<IActionResult> GetFlightStatus([FromQuery(Name = "ref")] string reference)
        {
            if (string.IsNullOrWhiteSpace(reference))
                return BadRequest("A booking reference or flight number is required.");

            var query = reference.Trim();

            if (int.TryParse(query, out var flightNum))
            {
                var flight = await _context.Flights
                    .Where(f => f.flightNum == flightNum)
                    .Join(_context.Airports,
                        f => f.departingPort,
                        a => a.airportCode,
                        (f, dep) => new { f, dep })
                    .Join(_context.Airports,
                        x => x.f.arrivingPort,
                        a => a.airportCode,
                        (x, arr) => new { x.f, x.dep, arr })
                    .Select(x => new FlightStatusDto
                    {
                        FlightNum = x.f.flightNum,
                        Status = x.f.status.ToString(),
                        DepartingPort = x.f.departingPort,
                        ArrivingPort = x.f.arrivingPort,
                        DepartingCity = x.dep.city,
                        ArrivingCity = x.arr.city,

                        // local display
                        DepartTime = x.f.scheduledDepartLocal ?? x.f.departTime,
                        ArrivalTime = x.f.scheduledArrivalLocal ?? x.f.arrivalTime,

                        // utc tracker math
                        DepartTimeUtc = x.f.departTime,
                        ArrivalTimeUtc = x.f.arrivalTime,

                        AircraftUsed = x.f.aircraftUsed,
                        BookingId = null,
                    })
                    .FirstOrDefaultAsync();

                if (flight == null)
                    return NotFound("No flight found with that number.");

                return Ok(flight);
            }

            var normalized = query.Replace("-", "").ToLower();
            var prefix = normalized[..Math.Min(8, normalized.Length)];

            var booking = await _context.Bookings
                .Where(b => b.bookingId.Replace("-", "").ToLower().StartsWith(prefix))
                .Include(b => b.Tickets)
                    .ThenInclude(t => t.Flight)
                .OrderByDescending(b => b.bookingDate)
                .FirstOrDefaultAsync();

            if (booking == null)
                return NotFound("No booking found matching that reference.");

            var results = booking.Tickets
                .Where(t => t.Flight != null)
                .GroupBy(t => t.flightCode)
                .Select(g =>
                {
                    var f = g.First().Flight!;
                    var depCity = _context.Airports
                        .Where(a => a.airportCode == f.departingPort)
                        .Select(a => a.city)
                        .FirstOrDefault();
                    var arrCity = _context.Airports
                        .Where(a => a.airportCode == f.arrivingPort)
                        .Select(a => a.city)
                        .FirstOrDefault();
                    
                    return new FlightStatusDto
                    {
                        FlightNum = f.flightNum,
                        Status = f.status.ToString(),
                        DepartingPort = f.departingPort,
                        ArrivingPort = f.arrivingPort,

                        // local display
                        DepartTime = f.scheduledDepartLocal ?? f.departTime,
                        ArrivalTime = f.scheduledArrivalLocal ?? f.arrivalTime,

                        // utc tracker math
                        DepartTimeUtc = f.departTime,
                        ArrivalTimeUtc = f.arrivalTime,

                        BookingId = booking.bookingId,
                        AircraftUsed = f.aircraftUsed,
                        DepartingCity = depCity,
                        ArrivingCity = arrCity,
                    };
                })
                .OrderBy(f => f.DepartTime)
                .ToList();

            return Ok(results);
        }

        /// <summary>
        /// Look up flight status by a short booking reference (first 8 chars of the UUID)
        /// or by a plain flight number. No auth required so users can check without logging in.
        /// GET /api/booking/status?ref=565b2bda
        /// GET /api/booking/status?ref=1342
        /// </summary>
        [AllowAnonymous]
        [HttpGet("status")]
        public async Task<IActionResult> GetFlightStatus([FromQuery(Name = "ref")] string reference)
        {
            if (string.IsNullOrWhiteSpace(reference))
                return BadRequest("A booking reference or flight number is required.");

            var query = reference.Trim();

            if (int.TryParse(query, out var flightNum))
            {
                var flight = await _context.Flights
                    .Where(f => f.flightNum == flightNum)
                    .Join(_context.Airports,
                        f => f.departingPort,
                        a => a.airportCode,
                        (f, dep) => new { f, dep })
                    .Join(_context.Airports,
                        x => x.f.arrivingPort,
                        a => a.airportCode,
                        (x, arr) => new { x.f, x.dep, arr })
                    .Select(x => new FlightStatusDto
                    {
                        FlightNum = x.f.flightNum,
                        Status = x.f.status.ToString(),
                        DepartingPort = x.f.departingPort,
                        ArrivingPort = x.f.arrivingPort,
                        DepartingCity = x.dep.city,
                        ArrivingCity = x.arr.city,

                        // local display
                        DepartTime = x.f.scheduledDepartLocal ?? x.f.departTime,
                        ArrivalTime = x.f.scheduledArrivalLocal ?? x.f.arrivalTime,

                        // utc tracker math
                        DepartTimeUtc = x.f.departTime,
                        ArrivalTimeUtc = x.f.arrivalTime,

                        AircraftUsed = x.f.aircraftUsed,
                        BookingId = null,
                    })
                    .FirstOrDefaultAsync();

                if (flight == null)
                    return NotFound("No flight found with that number.");

                return Ok(flight);
            }

            var normalized = query.Replace("-", "").ToLower();
            var prefix = normalized[..Math.Min(8, normalized.Length)];

            var booking = await _context.Bookings
                .Where(b => b.bookingId.Replace("-", "").ToLower().StartsWith(prefix))
                .Include(b => b.Tickets)
                    .ThenInclude(t => t.Flight)
                .OrderByDescending(b => b.bookingDate)
                .FirstOrDefaultAsync();

            if (booking == null)
                return NotFound("No booking found matching that reference.");

            var results = booking.Tickets
                .Where(t => t.Flight != null)
                .GroupBy(t => t.flightCode)
                .Select(g =>
                {
                    var f = g.First().Flight!;
                    var depCity = _context.Airports
                        .Where(a => a.airportCode == f.departingPort)
                        .Select(a => a.city)
                        .FirstOrDefault();
                    var arrCity = _context.Airports
                        .Where(a => a.airportCode == f.arrivingPort)
                        .Select(a => a.city)
                        .FirstOrDefault();
                    
                    return new FlightStatusDto
                    {
                        FlightNum = f.flightNum,
                        Status = f.status.ToString(),
                        DepartingPort = f.departingPort,
                        ArrivingPort = f.arrivingPort,

                        // local display
                        DepartTime = f.scheduledDepartLocal ?? f.departTime,
                        ArrivalTime = f.scheduledArrivalLocal ?? f.arrivalTime,

                        // utc tracker math
                        DepartTimeUtc = f.departTime,
                        ArrivalTimeUtc = f.arrivalTime,

                        BookingId = booking.bookingId,
                        AircraftUsed = f.aircraftUsed,
                        DepartingCity = depCity,
                        ArrivingCity = arrCity,
                    };
                })
                .OrderBy(f => f.DepartTime)
                .ToList();

            return Ok(results);
        }

    }   

}
