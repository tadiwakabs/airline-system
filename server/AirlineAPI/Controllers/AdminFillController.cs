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

            var effectiveDepart = flight.scheduledDepartLocal ?? flight.departTime;
            if (effectiveDepart <= DateTime.UtcNow && effectiveDepart <= DateTime.Now)
            {
                return BadRequest(new { message = "Cannot autofill a flight that has already departed." });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var rng = new Random();

                var created = await CreateFillForFlightAsync(
                    flight,
                    request.FillClass,
                    request.FillMode,
                    request.SeatCount,
                    request.FillPercent,
                    request.FillPercentMin,
                    request.FillPercentMax,
                    request.RandomizeSeats,
                    request.PaymentMethod,
                    rng
                );

                await transaction.CommitAsync();

                return Ok(new FillFlightResultDto
                {
                    Message = $"Created {created.Count} passenger booking(s) for flight {flight.flightNum}.",
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
        
        [HttpPost("batch")]
        public async Task<IActionResult> FillMultipleFlights([FromBody] FillMultipleFlightsRequestDto request)
        {
            if (!await IsAdminAsync())
                return Forbid();

            if (request == null || request.FlightNums == null || !request.FlightNums.Any())
                return BadRequest(new { message = "At least one flight number is required." });

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

            var flights = await _context.Flights
                .Include(f => f.Pricing)
                .Where(f => request.FlightNums.Contains(f.flightNum))
                .ToListAsync();

            if (!flights.Any())
                return NotFound(new { message = "No matching flights found." });

            var rng = new Random();
            var allCreated = new List<object>();
            var errors = new List<string>();

            foreach (var flight in flights)
            {
                var effectiveDepart = flight.scheduledDepartLocal ?? flight.departTime;
                if (effectiveDepart <= DateTime.UtcNow && effectiveDepart <= DateTime.Now)
                {
                    errors.Add($"Flight {flight.flightNum}: already departed.");
                    continue;
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    var created = await CreateFillForFlightAsync(
                        flight,
                        request.FillClass,
                        request.FillMode,
                        request.SeatCount,
                        request.FillPercent,
                        request.FillPercentMin,
                        request.FillPercentMax,
                        request.RandomizeSeats,
                        request.PaymentMethod,
                        rng
                    );

                    await transaction.CommitAsync();

                    allCreated.AddRange(created.Select(c => new
                    {
                        flightNum = flight.flightNum,
                        passengerId = c.PassengerId,
                        bookingId = c.BookingId,
                        ticketCode = c.TicketCode,
                        seatNumber = c.SeatNumber,
                        cabinClass = c.CabinClass,
                        price = c.Price
                    }));
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    errors.Add($"Flight {flight.flightNum}: {ex.Message}");
                }
            }

            return Ok(new
            {
                message = $"Batch fill complete. {allCreated.Count} booking(s) created across {flights.Count} flight(s).",
                flightsProcessed = flights.Count,
                totalCreated = allCreated.Count,
                errors,
                items = allCreated
            });
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

            var nowUtc = DateTime.UtcNow;
            var nowLocal = DateTime.Now;

            var flights = await _context.Flights
                .Include(f => f.Pricing)
                .Where(f =>
                    f.departingPort == request.DepartingPort &&
                    f.arrivingPort == request.ArrivingPort &&
                    ((f.scheduledDepartLocal.HasValue && f.scheduledDepartLocal > nowLocal) ||
                     (!f.scheduledDepartLocal.HasValue && f.departTime > nowUtc)))
                .ToListAsync();

            if (!flights.Any())
                return NotFound(new { message = "No flights found for this route." });
            
            var allCreated = new List<object>();
            var errors = new List<string>();

            var rng = new Random();

            foreach (var flight in flights)
            {
                await using var transaction = await _context.Database.BeginTransactionAsync();

                try
                {
                    var created = await CreateFillForFlightAsync(
                        flight,
                        request.FillClass,
                        request.FillMode,
                        request.SeatCount,
                        request.FillPercent,
                        request.FillPercentMin,
                        request.FillPercentMax,
                        request.RandomizeSeats,
                        request.PaymentMethod,
                        rng
                    );

                    await transaction.CommitAsync();

                    allCreated.AddRange(created.Select(c => new
                    {
                        flightNum = flight.flightNum,
                        passengerId = c.PassengerId,
                        bookingId = c.BookingId,
                        ticketCode = c.TicketCode,
                        seatNumber = c.SeatNumber,
                        cabinClass = c.CabinClass,
                        price = c.Price
                    }));
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
        
        private static void ValidatePercentRange(int? min, int? max)
        {
            if (!min.HasValue || !max.HasValue)
                throw new Exception("Fill percent min and max are required.");

            if (min.Value < 1 || min.Value > 100 || max.Value < 1 || max.Value > 100)
                throw new Exception("Fill percent min/max must be between 1 and 100.");

            if (min.Value > max.Value)
                throw new Exception("Fill percent min cannot be greater than max.");
        }

        private static int GetRandomPercentInRange(Random rng, int min, int max)
        {
            if (min == max) return min;
            return rng.Next(min, max + 1);
        }

        private static List<T> ShuffleList<T>(IEnumerable<T> items, Random rng)
        {
            var list = items.ToList();
            for (int i = list.Count - 1; i > 0; i--)
            {
                int j = rng.Next(i + 1);
                (list[i], list[j]) = (list[j], list[i]);
            }
            return list;
        }

        private async Task<List<FillFlightCreatedItemDto>> CreateFillForFlightAsync(
            Flight flight,
            string fillClass,
            string fillMode,
            int? seatCount,
            int? fillPercent,
            int? fillPercentMin,
            int? fillPercentMax,
            bool randomizeSeats,
            string paymentMethod,
            Random rng)
        {
            IQueryable<Seating> seatsQuery = _context.Seating
                .Where(s => s.flightNum == flight.flightNum && s.seatStatus == SeatStatus.Available);

            if (fillClass != "all")
            {
                var seatClass = ParseSeatClass(fillClass);
                seatsQuery = seatsQuery.Where(s => s.seatclass == seatClass);
            }

            var availableSeats = await seatsQuery
                .OrderBy(s => s.seatNumber)
                .ToListAsync();

            if (!availableSeats.Any())
                throw new Exception("No available seats match the selected fill class.");

            int requestedSeatCount;

            if (fillMode == "percent")
            {
                int percentToUse;

                if (fillPercent.HasValue)
                {
                    if (fillPercent.Value <= 0 || fillPercent.Value > 100)
                        throw new Exception("Fill percent must be between 1 and 100.");

                    percentToUse = fillPercent.Value;
                }
                else
                {
                    ValidatePercentRange(fillPercentMin, fillPercentMax);
                    percentToUse = GetRandomPercentInRange(rng, fillPercentMin!.Value, fillPercentMax!.Value);
                }

                requestedSeatCount = (int)Math.Ceiling(availableSeats.Count * (percentToUse / 100.0));
                if (requestedSeatCount <= 0)
                    requestedSeatCount = 1;
            }
            else
            {
                if (!seatCount.HasValue || seatCount.Value <= 0)
                    throw new Exception("Seat count must be greater than zero.");

                requestedSeatCount = seatCount.Value;
            }

            if (requestedSeatCount > availableSeats.Count)
            {
                throw new Exception($"Only {availableSeats.Count} available seat(s) match the selected fill class.");
            }

            var seatsToUse = randomizeSeats
                ? ShuffleList(availableSeats, rng).Take(requestedSeatCount).ToList()
                : availableSeats.Take(requestedSeatCount).ToList();

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
                    paymentMethod = paymentMethod,
                    paymentStatus = PaymentStatus.Success
                };

                _context.Payments.Add(payment);

                var ticket = new Ticket
                {
                    ticketCode = BuildTicketCode(booking.bookingId, flight.flightNum, seat.seatNumber),
                    bookingId = booking.bookingId,
                    price = pricing.Price,
                    issueDate = DateTime.UtcNow,
                    origin = flight.departingPort,
                    destination = flight.arrivingPort,
                    boardingTime = (flight.scheduledDepartLocal ?? flight.departTime).AddHours(-1).ToString("yyyy-MM-dd HH:mm"),
                    seatNumber = seat.seatNumber,
                    flightCode = flight.flightNum,
                    status = TicketStatus.Booked,
                    ticketClass = ConvertCabinClassToTicketClass(cabinClass),
                    passengerId = passenger.PassengerId,
                    reservationTime = DateTime.UtcNow
                };
                _context.Ticket.Add(ticket);

                var baggage = new Baggage
                {
                    baggageId = Guid.NewGuid().ToString("N")[..30],
                    passengerId = passenger.PassengerId,
                    additionalBaggage = false,
                    additionalFare = 0,
                    isChecked = false,
                    ticketCode = ticket.ticketCode
                };
                _context.Add(baggage);

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

            return created;
        }
    }

    public class FillFlightRequestDto
    {
        public int FlightNum { get; set; }

        // mode: "seats" or "percent"
        public string FillMode { get; set; } = "seats";

        // used when FillMode = "seats"
        public int? SeatCount { get; set; }

        // used when FillMode = "percent" for a fixed value
        public int? FillPercent { get; set; }

        // used when FillMode = "percent" for a range
        public int? FillPercentMin { get; set; }
        public int? FillPercentMax { get; set; }

        public string FillClass { get; set; } = "all";
        public string PaymentMethod { get; set; } = "Visa";
        public bool RandomizeSeats { get; set; } = false;
    }
    
    public class FillMultipleFlightsRequestDto
    {
        public List<int> FlightNums { get; set; } = new();

        public string FillMode { get; set; } = "seats";
        public int? SeatCount { get; set; }
        public int? FillPercent { get; set; }
        public int? FillPercentMin { get; set; }
        public int? FillPercentMax { get; set; }

        public string FillClass { get; set; } = "all";
        public string PaymentMethod { get; set; } = "Visa";
        public bool RandomizeSeats { get; set; } = false;
    }
    
    public class FillRouteRequestDto
    {
        public string DepartingPort { get; set; } = "";
        public string ArrivingPort { get; set; } = "";

        // "seats" or "percent"
        public string FillMode { get; set; } = "seats";

        public int? SeatCount { get; set; }

        // single percent (optional)
        public int? FillPercent { get; set; }

        // percent range (new)
        public int? FillPercentMin { get; set; }
        public int? FillPercentMax { get; set; }

        public string FillClass { get; set; } = "all";
        public string PaymentMethod { get; set; } = "Visa";

        public bool RandomizeSeats { get; set; } = true;
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
