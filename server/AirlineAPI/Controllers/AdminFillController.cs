using System.Security.Claims;
using AirlineAPI.Data;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/admin/fill-flight")]
    [Authorize]
    public class AdminFillController : ControllerBase
    {
        private readonly AppDbContext _context;
        private const string FillUserId = "f49a49ed-5a11-4dc9-8df8-a0df8e0d2c02";

        public AdminFillController(AppDbContext context)
        {
            _context = context;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirst("sub")?.Value
                   ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        private async Task<bool> IsAdminAsync()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrWhiteSpace(userId))
                return false;

            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.userId == userId && e.IsAdmin);

            return employee != null;
        }

        [HttpGet("{flightNum}/summary")]
        public async Task<IActionResult> GetFlightFillSummary(int flightNum, [FromQuery] string fillClass = "all")
        {
            if (!await IsAdminAsync())
                return Forbid();

            fillClass = NormalizeFillClass(fillClass);
            if (fillClass == "")
                return BadRequest(new { message = "Invalid fill class." });

            var flight = await _context.Flights
                .Include(f => f.Pricing)
                .FirstOrDefaultAsync(f => f.flightNum == flightNum);

            if (flight == null)
                return NotFound(new { message = "Flight not found." });

            var seatsQuery = _context.Seating
                .Where(s => s.flightNum == flightNum);

            if (fillClass != "all")
            {
                var seatClass = ParseSeatClass(fillClass);
                seatsQuery = seatsQuery.Where(s => s.seatclass == seatClass);
            }

            var availableSeats = await seatsQuery
                .Where(s => s.seatStatus == SeatStatus.Available)
                .OrderBy(s => s.seatNumber)
                .Select(s => new
                {
                    s.seatNumber,
                    seatClass = s.seatclass != null ? s.seatclass.ToString() : null
                })
                .ToListAsync();

            var occupiedCount = await seatsQuery.CountAsync(s => s.seatStatus == SeatStatus.Occupied);
            var reservedCount = await seatsQuery.CountAsync(s => s.seatStatus == SeatStatus.Reserved);
            var totalCount = await seatsQuery.CountAsync();

            return Ok(new FlightFillSummaryDto
            {
                FlightNum = flight.flightNum,
                DepartingPort = flight.departingPort,
                ArrivingPort = flight.arrivingPort,
                DepartTimeUtc = flight.departTime,
                ArrivalTimeUtc = flight.arrivalTime,
                ScheduledDepartLocal = flight.scheduledDepartLocal ?? flight.departTime,
                ScheduledArrivalLocal = flight.scheduledArrivalLocal ?? flight.arrivalTime,
                Status = flight.status,
                FillClass = fillClass,
                TotalSeats = totalCount,
                OccupiedSeats = occupiedCount,
                ReservedSeats = reservedCount,
                AvailableSeats = availableSeats.Count,
                AvailableSeatNumbers = availableSeats.Cast<object>().ToList()
            });
        }

        [HttpPost]
        public async Task<IActionResult> FillFlight([FromBody] FillFlightRequestDto request)
        {
            if (!await IsAdminAsync())
                return Forbid();

            if (request == null)
                return BadRequest(new { message = "Request body is required." });

            request.FillClass = NormalizeFillClass(request.FillClass);
            if (request.FillClass == "")
                return BadRequest(new { message = "Invalid fill class." });

            request.FillMode = NormalizeFillMode(request.FillMode);
            if (request.FillMode == "")
                return BadRequest(new { message = "Invalid fill mode. Use 'seats' or 'percent'." });

            request.PaymentMethod = NormalizePaymentMethod(request.PaymentMethod);
            if (string.IsNullOrWhiteSpace(request.PaymentMethod))
                return BadRequest(new { message = "Invalid payment method." });

            var fillUserExists = await _context.Users.AnyAsync(u => u.UserId == FillUserId);
            if (!fillUserExists)
                return BadRequest(new { message = "Configured fill user does not exist." });

            var flight = await _context.Flights
                .Include(f => f.Pricing)
                .FirstOrDefaultAsync(f => f.flightNum == request.FlightNum);

            if (flight == null)
                return NotFound(new { message = "Flight not found." });

            IQueryable<Seating> seatsQuery = _context.Seating
                .Where(s => s.flightNum == request.FlightNum && s.seatStatus == SeatStatus.Available);

            if (request.FillClass != "all")
            {
                var seatClass = ParseSeatClass(request.FillClass);
                seatsQuery = seatsQuery.Where(s => s.seatclass == seatClass);
            }

            var totalAvailable = await seatsQuery.CountAsync();

            if (totalAvailable == 0)
            {
                return BadRequest(new { message = "No available seats match the selected fill class." });
            }

            int requestedSeatCount;

            if (request.FillMode == "percent")
            {
                if (!request.FillPercent.HasValue || request.FillPercent.Value <= 0 || request.FillPercent.Value > 100)
                    return BadRequest(new { message = "Fill percent must be between 1 and 100." });

                requestedSeatCount = (int)Math.Ceiling(totalAvailable * (request.FillPercent.Value / 100.0));

                if (requestedSeatCount <= 0)
                    requestedSeatCount = 1;
            }
            else
            {
                if (!request.SeatCount.HasValue || request.SeatCount.Value <= 0)
                    return BadRequest(new { message = "Seat count must be greater than zero." });

                requestedSeatCount = request.SeatCount.Value;
            }

            var seatsToUse = await seatsQuery
                .OrderBy(s => s.seatNumber)
                .Take(requestedSeatCount)
                .ToListAsync();

            if (seatsToUse.Count < requestedSeatCount)
            {
                return BadRequest(new
                {
                    message = $"Only {seatsToUse.Count} available seat(s) match the selected fill class."
                });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var created = new List<FillFlightCreatedItemDto>();

                foreach (var seat in seatsToUse)
                {
                    if (seat.seatclass == null)
                        throw new Exception($"Seat {seat.seatNumber} has no seat class.");

                    var cabinClass = ConvertSeatClassToCabinClass(seat.seatclass.Value);

                    var pricing = flight.Pricing.FirstOrDefault(p => p.CabinClass == cabinClass);
                    if (pricing == null)
                        throw new Exception($"No pricing found for {cabinClass} on flight {flight.flightNum}.");

                    var passenger = new Passenger
                    {
                        PassengerId = Guid.NewGuid().ToString("N"),
                        UserId = null,
                        OwnerUserId = null,
                        FirstName = "Auto",
                        LastName = $"Passenger {seat.seatNumber}",
                        DateOfBirth = new DateTime(1990, 1, 1),
                        Gender = Gender.Other,
                        PassengerType = PassengerType.Adult,
                        Email = null,
                        PhoneNumber = null
                    };

                    _context.Passenger.Add(passenger);
                    await _context.SaveChangesAsync();

                    var booking = new Booking
                    {
                        bookingId = Guid.NewGuid().ToString(),
                        bookingDate = DateTime.UtcNow,
                        bookingStatus = BookingStatus.Confirmed,
                        totalPrice = pricing.Price,
                        userId = FillUserId
                    };

                    _context.Bookings.Add(booking);
                    await _context.SaveChangesAsync();

                    var payment = new Payment
                    {
                        userId = FillUserId,
                        bookingId = booking.bookingId,
                        bookingPrice = (double)pricing.Price,
                        totalPrice = (double)pricing.Price,
                        paymentMethod = request.PaymentMethod,
                        paymentStatus = PaymentStatus.Success
                    };

                    _context.Payments.Add(payment);

                    var ticketCode = BuildTicketCode(booking.bookingId, flight.flightNum, seat.seatNumber);

                    var ticket = new Ticket
                    {
                        ticketCode = ticketCode,
                        bookingId = booking.bookingId,
                        price = pricing.Price,
                        issueDate = DateTime.UtcNow,
                        origin = flight.departingPort,
                        destination = flight.arrivingPort,
                        boardingTime = (flight.scheduledDepartLocal ?? flight.departTime)
                            .AddHours(-1)
                            .ToString("yyyy-MM-dd HH:mm"),
                        seatNumber = seat.seatNumber,
                        flightCode = flight.flightNum,
                        status = TicketStatus.Booked,
                        ticketClass = ConvertCabinClassToTicketClass(cabinClass),
                        passengerId = passenger.PassengerId,
                        reservationTime = DateTime.UtcNow
                    };

                    _context.Ticket.Add(ticket);

                    seat.seatStatus = SeatStatus.Occupied;
                    seat.passengerId = passenger.PassengerId;
                    seat.holdExpiresAt = null;

                    await _context.SaveChangesAsync();

                    created.Add(new FillFlightCreatedItemDto
                    {
                        PassengerId = passenger.PassengerId,
                        BookingId = booking.bookingId,
                        TicketCode = ticket.ticketCode,
                        SeatNumber = seat.seatNumber,
                        CabinClass = cabinClass.ToString(),
                        Price = pricing.Price
                    });
                }

                await transaction.CommitAsync();

                return Ok(new FillFlightResultDto
                {
                    Message = request.FillMode == "percent"
                        ? $"Created {created.Count} passenger booking(s) using {request.FillPercent}% fill."
                        : $"Created {created.Count} passenger booking(s).",
                    FlightNum = flight.flightNum,
                    FillClass = request.FillClass,
                    CreatedCount = created.Count,
                    Items = created
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new
                {
                    message = "Flight fill failed.",
                    detail = ex.Message
                });
            }
        }

        [HttpPost("route")]
public async Task<IActionResult> FillRoute([FromBody] FillRouteRequestDto request)
{
    if (!await IsAdminAsync())
        return Forbid();

    if (request == null)
        return BadRequest(new { message = "Request body is required." });

    request.PaymentMethod = NormalizePaymentMethod(request.PaymentMethod);
    if (string.IsNullOrWhiteSpace(request.PaymentMethod))
        return BadRequest(new { message = "Invalid payment method." });

    var fillUserExists = await _context.Users.AnyAsync(u => u.UserId == FillUserId);
    if (!fillUserExists)
        return BadRequest(new { message = "Configured fill user does not exist." });

    var flights = await _context.Flights
        .Include(f => f.Pricing)
        .Where(f => f.departingPort == request.DepartingPort && f.arrivingPort == request.ArrivingPort)
        .ToListAsync();

    if (!flights.Any())
        return NotFound(new { message = "No flights found for this route." });

    var rng = new Random();
    var allCreated = new List<object>();
    var errors = new List<string>();

    foreach (var flight in flights)
    {
        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var cabinRanges = new[]
            {
                new { Class = "economy", SeatClass = SeatClass.Economy, CabinClass = CabinClass.Economy, Min = request.EconomyMin, Max = request.EconomyMax },
                new { Class = "business", SeatClass = SeatClass.Business, CabinClass = CabinClass.Business, Min = request.BusinessMin, Max = request.BusinessMax },
                new { Class = "first",    SeatClass = SeatClass.First,    CabinClass = CabinClass.First,    Min = request.FirstMin,    Max = request.FirstMax },
            };

            var flightCreated = new List<object>();

            foreach (var cabin in cabinRanges)
            {
                if (cabin.Min <= 0 && cabin.Max <= 0) continue;

                var availableSeats = await _context.Seating
                    .Where(s => s.flightNum == flight.flightNum
                             && s.seatStatus == SeatStatus.Available
                             && s.seatclass == cabin.SeatClass)
                    .OrderBy(s => s.seatNumber)
                    .ToListAsync();

                if (!availableSeats.Any()) continue;

                var fillPct = rng.Next(cabin.Min, cabin.Max + 1);
                var seatsToFill = (int)Math.Ceiling(availableSeats.Count * (fillPct / 100.0));
                var seatsToUse = availableSeats.Take(seatsToFill).ToList();

                var pricing = flight.Pricing.FirstOrDefault(p => p.CabinClass == cabin.CabinClass);
                if (pricing == null) continue;

                foreach (var seat in seatsToUse)
                {
                    var passenger = new Passenger
                    {
                        PassengerId = Guid.NewGuid().ToString("N"),
                        UserId = null,
                        OwnerUserId = null,
                        FirstName = "Auto",
                        LastName = $"Passenger {seat.seatNumber}",
                        DateOfBirth = new DateTime(1990, 1, 1),
                        Gender = Gender.Other,
                        PassengerType = PassengerType.Adult,
                        Email = null,
                        PhoneNumber = null
                    };
                    _context.Passenger.Add(passenger);
                    await _context.SaveChangesAsync();

                    var booking = new Booking
                    {
                        bookingId = Guid.NewGuid().ToString(),
                        bookingDate = DateTime.UtcNow,
                        bookingStatus = BookingStatus.Confirmed,
                        totalPrice = pricing.Price,
                        userId = FillUserId
                    };
                    _context.Bookings.Add(booking);
                    await _context.SaveChangesAsync();

                    var payment = new Payment
                    {
                        userId = FillUserId,
                        bookingId = booking.bookingId,
                        bookingPrice = (double)pricing.Price,
                        totalPrice = (double)pricing.Price,
                        paymentMethod = request.PaymentMethod,
                        paymentStatus = PaymentStatus.Success
                    };
                    _context.Payments.Add(payment);

                    var ticket = new Ticket
                    {
                        ticketCode = $"{flight.flightNum}{seat.seatNumber}{Guid.NewGuid().ToString("N")[..10]}",
                        bookingId = booking.bookingId,
                        price = pricing.Price,
                        issueDate = DateTime.UtcNow,
                        origin = flight.departingPort,
                        destination = flight.arrivingPort,
                        boardingTime = (flight.scheduledDepartLocal ?? flight.departTime).AddHours(-1).ToString("yyyy-MM-dd HH:mm"),
                        seatNumber = seat.seatNumber,
                        flightCode = flight.flightNum,
                        status = TicketStatus.Booked,
                        ticketClass = ConvertCabinClassToTicketClass(cabin.CabinClass),
                        passengerId = passenger.PassengerId,
                        reservationTime = DateTime.UtcNow
                    };
                    _context.Ticket.Add(ticket);

                    seat.seatStatus = SeatStatus.Occupied;
                    seat.passengerId = passenger.PassengerId;
                    seat.holdExpiresAt = null;

                    await _context.SaveChangesAsync();

                    flightCreated.Add(new
                    {
                        flightNum = flight.flightNum,
                        seatNumber = seat.seatNumber,
                        cabinClass = cabin.Class,
                        fillPct,
                        price = pricing.Price,
                        ticketCode = ticket.ticketCode
                    });
                }
            }

            await transaction.CommitAsync();
            allCreated.AddRange(flightCreated);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            errors.Add($"Flight {flight.flightNum}: {ex.Message}");
        }
    }

    return Ok(new
    {
        message = $"Route fill complete. {allCreated.Count} bookings created across {flights.Count} flights.",
        flightsProcessed = flights.Count,
        totalCreated = allCreated.Count,
        errors,
        items = allCreated
    });
}

        private static string NormalizeFillClass(string? fillClass)
        {
            if (string.IsNullOrWhiteSpace(fillClass)) return "";

            return fillClass.Trim().ToLower() switch
            {
                "all" => "all",
                "economy" => "economy",
                "business" => "business",
                "first" => "first",
                _ => ""
            };
        }

        private static SeatClass ParseSeatClass(string fillClass) =>
            fillClass switch
            {
                "business" => SeatClass.Business,
                "first" => SeatClass.First,
                _ => SeatClass.Economy
            };

        private static CabinClass ConvertSeatClassToCabinClass(SeatClass seatClass) =>
            seatClass switch
            {
                SeatClass.Business => CabinClass.Business,
                SeatClass.First => CabinClass.First,
                _ => CabinClass.Economy
            };

        private static TicketClass ConvertCabinClassToTicketClass(CabinClass cabinClass) =>
            cabinClass switch
            {
                CabinClass.Business => TicketClass.Business,
                CabinClass.First => TicketClass.First,
                _ => TicketClass.Economy
            };

        private static string BuildTicketCode(string bookingId, int flightNum, string seatNumber)
        {
            var shortBooking = bookingId.Replace("-", "")[..8].ToUpper();
            var suffix = Guid.NewGuid().ToString("N")[..4].ToUpper();
            return $"{flightNum}{seatNumber}{Guid.NewGuid().ToString("N")[..10]}";
        }
        
        private static string NormalizeFillMode(string? fillMode)
        {
            if (string.IsNullOrWhiteSpace(fillMode)) return "";

            return fillMode.Trim().ToLower() switch
            {
                "seats" => "seats",
                "percent" => "percent",
                _ => ""
            };
        }

        private static string NormalizePaymentMethod(string? paymentMethod)
        {
            if (string.IsNullOrWhiteSpace(paymentMethod)) return "";

            return paymentMethod.Trim() switch
            {
                "Visa" => "Visa",
                "Mastercard" => "Mastercard",
                "American Express" => "American Express",
                "Discover" => "Discover",
                "PayPal" => "PayPal",
                _ => ""
            };
        }
    }

    public class FillFlightRequestDto
    {
        public int FlightNum { get; set; }

        // mode: "seats" or "percent"
        public string FillMode { get; set; } = "seats";

        // used when FillMode = "seats"
        public int? SeatCount { get; set; }

        // used when FillMode = "percent"
        public int? FillPercent { get; set; }

        public string FillClass { get; set; } = "all";
        public string PaymentMethod { get; set; } = "Visa";
    }

    public class FlightFillSummaryDto
    {
        public int FlightNum { get; set; }
        public string DepartingPort { get; set; } = "";
        public string ArrivingPort { get; set; } = "";
        public DateTime DepartTimeUtc { get; set; }
        public DateTime ArrivalTimeUtc { get; set; }
        public DateTime ScheduledDepartLocal { get; set; }
        public DateTime ScheduledArrivalLocal { get; set; }
        public string Status { get; set; } = "";
        public string FillClass { get; set; } = "";
        public int TotalSeats { get; set; }
        public int OccupiedSeats { get; set; }
        public int ReservedSeats { get; set; }
        public int AvailableSeats { get; set; }
        public List<object> AvailableSeatNumbers { get; set; } = new();
    }

    public class FillFlightCreatedItemDto
    {
        public string PassengerId { get; set; } = "";
        public string BookingId { get; set; } = "";
        public string TicketCode { get; set; } = "";
        public string SeatNumber { get; set; } = "";
        public string CabinClass { get; set; } = "";
        public decimal Price { get; set; }
    }

    public class FillFlightResultDto
    {
        public string Message { get; set; } = "";
        public int FlightNum { get; set; }
        public string FillClass { get; set; } = "";
        public int CreatedCount { get; set; }
        public List<FillFlightCreatedItemDto> Items { get; set; } = new();
    }
}
