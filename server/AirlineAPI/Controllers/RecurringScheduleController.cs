using AirlineAPI.Data;
using AirlineAPI.DTOs.Flight;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/recurring-schedules")]
    public class RecurringSchedulesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RecurringSchedulesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RecurringScheduleResponseDto>>> GetAll()
        {
            var schedules = await _context.RecurringSchedules
                .OrderBy(r => r.Id)
                .ToListAsync();

            var result = schedules.Select(MapToResponseDto).ToList();
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<RecurringScheduleResponseDto>> GetById(int id)
        {
            var schedule = await _context.RecurringSchedules.FindAsync(id);

            if (schedule == null)
                return NotFound(new { message = "Recurring schedule not found." });

            return Ok(MapToResponseDto(schedule));
        }
        
        [HttpPost("bulk-import")]
        public async Task<ActionResult> BulkImport([FromBody] List<RecurringScheduleUpsertDto> schedules)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (schedules == null || schedules.Count == 0)
                return BadRequest(new { message = "No schedules provided." });

            var results = new List<object>();
            var errors  = new List<object>();

            int nextFlightNum = await _context.Flights.AnyAsync()
                ? await _context.Flights.MaxAsync(f => f.flightNum) + 1
                : 1;

            foreach (var (dto, index) in schedules.Select((s, i) => (s, i)))
            {
                // Basic validation
                if (dto.StartDate.Date > dto.EndDate.Date)
                { errors.Add(new { index, message = "Start date cannot be after end date." }); continue; }

                if (dto.DepartingPortCode == dto.ArrivingPortCode)
                { errors.Add(new { index, message = "Departing and arriving airports cannot be the same." }); continue; }

                if (dto.DaysOfWeek == null || dto.DaysOfWeek.Count == 0)
                { errors.Add(new { index, message = "At least one day of week must be selected." }); continue; }

                // Return-trip validation
                if (dto.IsReturn)
                {
                    if (!dto.LayoverHours.HasValue || dto.LayoverHours.Value < 1)
                    { errors.Add(new { index, message = "Layover hours must be at least 1 when creating a return schedule." }); continue; }

                    var outboundDuration = dto.ArrivalTimeOfDay - dto.DepartureTimeOfDay;
                    if (outboundDuration <= TimeSpan.Zero)
                        outboundDuration = outboundDuration.Add(TimeSpan.FromHours(24));

                    var totalRoundTripHours = outboundDuration.TotalHours * 2 + dto.LayoverHours.Value;
                    if (totalRoundTripHours > 24)
                    { errors.Add(new { index, message = $"Total round-trip time ({totalRoundTripHours:F1} hrs) exceeds 24 hours." }); continue; }
                }
                
                var airports = await GetFlightAirportsAsync(dto.DepartingPortCode, dto.ArrivingPortCode);
                if (airports == null)
                {
                    errors.Add(new { index, message = "One or both airports are invalid, or missing timezone data." });
                    continue;
                }

                // Create the schedule record
                var schedule = new RecurringSchedule
                {
                    DepartingPort       = dto.DepartingPortCode,
                    ArrivingPort        = dto.ArrivingPortCode,
                    DepartureTimeOfDay  = dto.DepartureTimeOfDay,
                    ArrivalTimeOfDay    = dto.ArrivalTimeOfDay,
                    AircraftUsed        = dto.AircraftUsed,
                    Status              = dto.Status,
                    IsDomestic          = dto.IsDomestic,
                    Distance            = dto.Distance,
                    FlightChange        = dto.FlightChange,
                    StartDate           = dto.StartDate.Date,
                    EndDate             = dto.EndDate.Date,
                    DaysOfWeek          = string.Join(",", dto.DaysOfWeek.OrderBy(d => d).Distinct()),
                    CreatedAt           = DateTime.UtcNow,
                    UpdatedAt           = DateTime.UtcNow,
                };

                _context.RecurringSchedules.Add(schedule);
                await _context.SaveChangesAsync(); // need the generated Id

                // Generate flights
                var selectedDays   = dto.DaysOfWeek.Distinct().ToHashSet();
                var flightsCreated = new List<Flight>();
                var now = DateTime.UtcNow;

                for (var date = dto.StartDate.Date; date <= dto.EndDate.Date; date = date.AddDays(1))
                {
                    if (!selectedDays.Contains((int)date.DayOfWeek)) continue;

                    var scheduledDepartLocal = date.Add(dto.DepartureTimeOfDay);
                    var scheduledArrivalLocal = date.Add(dto.ArrivalTimeOfDay);

                    if (scheduledArrivalLocal <= scheduledDepartLocal)
                        scheduledArrivalLocal = scheduledArrivalLocal.AddDays(1);

                    var departUtc = ConvertLocalToUtc(scheduledDepartLocal, airports.Value.dep.timezone!);
                    var arrivalUtc = ConvertLocalToUtc(scheduledArrivalLocal, airports.Value.arr.timezone!);

                    if (departUtc < now) continue;

                    flightsCreated.Add(new Flight
                    {
                        flightNum = nextFlightNum++,
                        departTime = departUtc,
                        arrivalTime = arrivalUtc,
                        scheduledDepartLocal = scheduledDepartLocal,
                        scheduledArrivalLocal = scheduledArrivalLocal,
                        aircraftUsed = dto.AircraftUsed,
                        status = dto.Status,
                        departingPort = dto.DepartingPortCode,
                        arrivingPort = dto.ArrivingPortCode,
                        isDomestic = dto.IsDomestic,
                        distance = dto.Distance,
                        flightChange = dto.FlightChange,
                        recurringScheduleId = schedule.Id,
                    });

                    // Return leg
                    if (dto.IsReturn && dto.LayoverHours.HasValue)
                    {
                        var outboundDuration   = scheduledArrivalLocal - scheduledDepartLocal;
                        var returnDepartLocal   = scheduledArrivalLocal.AddHours(dto.LayoverHours.Value);
                        var returnArrivalLocal  = returnDepartLocal.Add(outboundDuration);
                        var returnDepartUtc     = ConvertLocalToUtc(returnDepartLocal,  airports.Value.arr.timezone!);
                        var returnArrivalUtc    = ConvertLocalToUtc(returnArrivalLocal, airports.Value.dep.timezone!);

                        flightsCreated.Add(new Flight
                        {
                            flightNum = nextFlightNum++,
                            departTime = returnDepartUtc,
                            arrivalTime = returnArrivalUtc,
                            scheduledDepartLocal = returnDepartLocal,
                            scheduledArrivalLocal = returnArrivalLocal,
                            aircraftUsed = dto.AircraftUsed,
                            status = dto.Status,
                            departingPort = dto.ArrivingPortCode,  // reversed
                            arrivingPort = dto.DepartingPortCode,  // reversed
                            isDomestic = dto.IsDomestic,
                            distance = dto.Distance,
                            flightChange = dto.FlightChange,
                            recurringScheduleId = schedule.Id,
                        });
                    }
                }

                _context.Flights.AddRange(flightsCreated);
                await _context.SaveChangesAsync();

                await CreateSeatsForFlightsAsync(flightsCreated, dto.AircraftUsed);

                // Pricing
                if (dto.EconomyPrice.HasValue && dto.BusinessPrice.HasValue && dto.FirstPrice.HasValue)
                {
                    var pricingRows = flightsCreated.SelectMany(f => new[]
                    {
                        new FlightPricing { FlightNum = f.flightNum, CabinClass = CabinClass.Economy,  Price = dto.EconomyPrice.Value  },
                        new FlightPricing { FlightNum = f.flightNum, CabinClass = CabinClass.Business, Price = dto.BusinessPrice.Value },
                        new FlightPricing { FlightNum = f.flightNum, CabinClass = CabinClass.First,    Price = dto.FirstPrice.Value    },
                    }).ToList();

                    _context.FlightPricing.AddRange(pricingRows);
                    await _context.SaveChangesAsync();
                }

                results.Add(new { scheduleId = schedule.Id, flightsCreated = flightsCreated.Count });
            }

            return Ok(new { imported = results.Count, errors });
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult> Update(int id, [FromBody] RecurringScheduleUpsertDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var schedule = await _context.RecurringSchedules.FindAsync(id);
            if (schedule == null)
                return NotFound(new { message = "Recurring schedule not found." });

            if (dto.StartDate.Date > dto.EndDate.Date)
                return BadRequest(new { message = "Start date cannot be after end date." });

            if (dto.DepartingPortCode == dto.ArrivingPortCode)
                return BadRequest(new { message = "Departing and arriving airports cannot be the same." });

            if (dto.DaysOfWeek == null || dto.DaysOfWeek.Count == 0)
                return BadRequest(new { message = "At least one day of week must be selected." });

            // Return-trip validation
            if (dto.IsReturn)
            {
                if (!dto.LayoverHours.HasValue || dto.LayoverHours.Value < 1)
                    return BadRequest(new { message = "Layover hours must be at least 1 when creating a return schedule." });

                var outboundDuration = dto.ArrivalTimeOfDay - dto.DepartureTimeOfDay;
                if (outboundDuration <= TimeSpan.Zero)
                    outboundDuration = outboundDuration.Add(TimeSpan.FromHours(24));

                var totalRoundTripHours = outboundDuration.TotalHours * 2 + dto.LayoverHours.Value;
                if (totalRoundTripHours > 24)
                    return BadRequest(new
                    {
                        message = $"Total round-trip time ({totalRoundTripHours:F1} hrs) exceeds 24 hours. Reduce the layover or choose a shorter route."
                    });
            }
            
            var airports = await GetFlightAirportsAsync(dto.DepartingPortCode, dto.ArrivingPortCode);
            if (airports == null)
                return BadRequest(new { message = "One or both airports are invalid, or missing timezone data." });

            schedule.DepartingPort = dto.DepartingPortCode;
            schedule.ArrivingPort = dto.ArrivingPortCode;
            schedule.DepartureTimeOfDay = dto.DepartureTimeOfDay;
            schedule.ArrivalTimeOfDay = dto.ArrivalTimeOfDay;
            schedule.AircraftUsed = dto.AircraftUsed;
            schedule.Status = dto.Status;
            schedule.IsDomestic = dto.IsDomestic;
            schedule.Distance = dto.Distance;
            schedule.FlightChange = dto.FlightChange;
            schedule.StartDate = dto.StartDate.Date;
            schedule.EndDate = dto.EndDate.Date;
            schedule.DaysOfWeek = string.Join(",", dto.DaysOfWeek.OrderBy(d => d).Distinct());

            await _context.SaveChangesAsync();
            
            // Regenerate future flights
            var now = DateTime.UtcNow;

            // Delete future flights tied to this schedule
            var futureFlights = await _context.Flights
                .Where(f => f.recurringScheduleId == id && f.departTime >= now)
                .ToListAsync();
            
            // Regenerate future flights based on new schedule
            var selectedDays = dto.DaysOfWeek.Distinct().ToHashSet();
            var flightsToCreate = new List<Flight>();

            int nextFlightNum = await _context.Flights.AnyAsync()
                ? await _context.Flights.MaxAsync(f => f.flightNum) + 1
                : 1;

            for (var date = dto.StartDate.Date; date <= dto.EndDate.Date; date = date.AddDays(1))
            {
                var dayNum = (int)date.DayOfWeek; // 0=Sun ... 6=Sat
                if (!selectedDays.Contains(dayNum))
                    continue;

                var scheduledDepartLocal = date.Add(dto.DepartureTimeOfDay);
                var scheduledArrivalLocal = date.Add(dto.ArrivalTimeOfDay);

                if (scheduledArrivalLocal <= scheduledDepartLocal)
                    scheduledArrivalLocal = scheduledArrivalLocal.AddDays(1);

                var departUtc = ConvertLocalToUtc(scheduledDepartLocal, airports.Value.dep.timezone!);
                var arrivalUtc = ConvertLocalToUtc(scheduledArrivalLocal, airports.Value.arr.timezone!);

                if (departUtc < now)
                    continue;

                flightsToCreate.Add(new Flight
                {
                    flightNum = nextFlightNum++,
                    departTime = departUtc,
                    arrivalTime = arrivalUtc,
                    scheduledDepartLocal = scheduledDepartLocal,
                    scheduledArrivalLocal = scheduledArrivalLocal,
                    aircraftUsed = dto.AircraftUsed,
                    status = dto.Status,
                    departingPort = dto.DepartingPortCode,
                    arrivingPort = dto.ArrivingPortCode,
                    isDomestic = dto.IsDomestic,
                    distance = dto.Distance,
                    flightChange = dto.FlightChange,
                    recurringScheduleId = id
                });

                // Return leg
                if (dto.IsReturn && dto.LayoverHours.HasValue)
                {
                    var outboundDuration   = scheduledArrivalLocal - scheduledDepartLocal;
                    var returnDepartLocal   = scheduledArrivalLocal.AddHours(dto.LayoverHours.Value);
                    var returnArrivalLocal  = returnDepartLocal.Add(outboundDuration);
                    var returnDepartUtc     = ConvertLocalToUtc(returnDepartLocal,  airports.Value.arr.timezone!);
                    var returnArrivalUtc    = ConvertLocalToUtc(returnArrivalLocal, airports.Value.dep.timezone!);

                    flightsToCreate.Add(new Flight
                    {
                        flightNum = nextFlightNum++,
                        departTime = returnDepartUtc,
                        arrivalTime = returnArrivalUtc,
                        scheduledDepartLocal = returnDepartLocal,
                        scheduledArrivalLocal = returnArrivalLocal,
                        aircraftUsed = dto.AircraftUsed,
                        status = dto.Status,
                        departingPort = dto.ArrivingPortCode,  // reversed
                        arrivingPort = dto.DepartingPortCode,  // reversed
                        isDomestic = dto.IsDomestic,
                        distance = dto.Distance,
                        flightChange = dto.FlightChange,
                        recurringScheduleId = id
                    });
                }
            } // end date loop

            _context.Flights.AddRange(flightsToCreate);
            await _context.SaveChangesAsync();

            await CreateSeatsForFlightsAsync(flightsToCreate, dto.AircraftUsed);

            if (dto.EconomyPrice.HasValue && dto.BusinessPrice.HasValue && dto.FirstPrice.HasValue)
            {
                var pricingRows = new List<FlightPricing>();
                foreach (var flight in flightsToCreate)
                {
                    pricingRows.Add(new FlightPricing { FlightNum = flight.flightNum, CabinClass = CabinClass.Economy,  Price = dto.EconomyPrice.Value  });
                    pricingRows.Add(new FlightPricing { FlightNum = flight.flightNum, CabinClass = CabinClass.Business, Price = dto.BusinessPrice.Value });
                    pricingRows.Add(new FlightPricing { FlightNum = flight.flightNum, CabinClass = CabinClass.First,    Price = dto.FirstPrice.Value    });
                }
                _context.FlightPricing.AddRange(pricingRows);
                await _context.SaveChangesAsync();
            }

            _context.Flights.RemoveRange(futureFlights);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Recurring schedule updated successfully."
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<ActionResult> Delete(int id, [FromQuery] bool deleteFlights = false)
        {
            var schedule = await _context.RecurringSchedules.FindAsync(id);
            if (schedule == null)
                return NotFound(new { message = "Recurring schedule not found." });

            var now = DateTime.UtcNow;

            if (deleteFlights)
            {
                // Delete only future flights tied to this schedule
                var futureFlights = await _context.Flights
                    .Where(f => f.recurringScheduleId == id && f.departTime >= now)
                    .ToListAsync();

                _context.Flights.RemoveRange(futureFlights);
            }
            else
            {
                // Keep flights, just unlink them from this schedule
                var linkedFlights = await _context.Flights
                    .Where(f => f.recurringScheduleId == id)
                    .ToListAsync();

                foreach (var flight in linkedFlights)
                {
                    flight.recurringScheduleId = null;
                }
            }

            _context.RecurringSchedules.Remove(schedule);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = deleteFlights
                    ? "Recurring schedule and future flights deleted."
                    : "Recurring schedule deleted. Flights were unlinked."
            });
        }

        private static RecurringScheduleResponseDto MapToResponseDto(RecurringSchedule schedule)
        {
            return new RecurringScheduleResponseDto
            {
                Id = schedule.Id,
                DepartingPort = schedule.DepartingPort,
                ArrivingPort = schedule.ArrivingPort,
                DepartureTimeOfDay = schedule.DepartureTimeOfDay.ToString(@"hh\:mm\:ss"),
                ArrivalTimeOfDay = schedule.ArrivalTimeOfDay.ToString(@"hh\:mm\:ss"),
                AircraftUsed = schedule.AircraftUsed,
                Status = schedule.Status,
                IsDomestic = schedule.IsDomestic,
                Distance = schedule.Distance,
                FlightChange = schedule.FlightChange,
                StartDate = schedule.StartDate.ToString("yyyy-MM-dd"),
                EndDate = schedule.EndDate.ToString("yyyy-MM-dd"),
                DaysOfWeek = schedule.DaysOfWeek
            };
        }
        
        private async Task CreateSeatsForFlightsAsync(List<Flight> flights, string aircraftUsed)
        {
            if (flights == null || flights.Count == 0)
                return;

            var aircraft = await _context.Aircraft
                .FirstOrDefaultAsync(a => a.tailnumber == aircraftUsed);

            if (aircraft == null)
                throw new Exception("Assigned aircraft not found.");

            var allSeats = new List<Seating>();

            foreach (var flight in flights)
            {
                allSeats.AddRange(GenerateSeatsForFlight(flight.flightNum, aircraft.numSeats));
            }

            _context.Seating.AddRange(allSeats);
            await _context.SaveChangesAsync();
        }

        private static List<Seating> GenerateSeatsForFlight(int flightNum, int numSeats)
        {
            var seats = new List<Seating>();

            var firstLetters = new[] { "A", "B", "C", "D" };
            var standardLetters = new[] { "A", "B", "C", "D", "E", "F" };

            int created = 0;

            // First class (rows 1–4)
            for (int row = 1; row <= 4 && created < numSeats; row++)
            {
                foreach (var letter in firstLetters)
                {
                    if (created >= numSeats) break;

                    seats.Add(new Seating
                    {
                        flightNum = flightNum,
                        seatNumber = $"{row}{letter}",
                        seatclass = SeatClass.First,
                        seatStatus = SeatStatus.Available
                    });

                    created++;
                }
            }

            // Business (rows 5–10)
            for (int row = 5; row <= 10 && created < numSeats; row++)
            {
                foreach (var letter in standardLetters)
                {
                    if (created >= numSeats) break;

                    seats.Add(new Seating
                    {
                        flightNum = flightNum,
                        seatNumber = $"{row}{letter}",
                        seatclass = SeatClass.Business,
                        seatStatus = SeatStatus.Available
                    });

                    created++;
                }
            }

            // Economy (remaining)
            int economyRow = 11;
            while (created < numSeats)
            {
                foreach (var letter in standardLetters)
                {
                    if (created >= numSeats) break;

                    seats.Add(new Seating
                    {
                        flightNum = flightNum,
                        seatNumber = $"{economyRow}{letter}",
                        seatclass = SeatClass.Economy,
                        seatStatus = SeatStatus.Available
                    });

                    created++;
                }

                economyRow++;
            }

            return seats;
        }
        
        private async Task<(Airport dep, Airport arr)?> GetFlightAirportsAsync(string departingPortCode, string arrivingPortCode)
        {
            var dep = await _context.Airports.FindAsync(departingPortCode);
            var arr = await _context.Airports.FindAsync(arrivingPortCode);

            if (dep == null || arr == null)
                return null;

            if (string.IsNullOrWhiteSpace(dep.timezone) || string.IsNullOrWhiteSpace(arr.timezone))
                return null;

            return (dep, arr);
        }

        private static TimeZoneInfo ResolveTimeZone(string tz)
        {
            return TimeZoneInfo.FindSystemTimeZoneById(tz);
        }

        private static DateTime ConvertLocalToUtc(DateTime localDateTime, string timeZoneId)
        {
            var tz = ResolveTimeZone(timeZoneId);
            var unspecified = DateTime.SpecifyKind(localDateTime, DateTimeKind.Unspecified);
            return TimeZoneInfo.ConvertTimeToUtc(unspecified, tz);
        }
    }
}
