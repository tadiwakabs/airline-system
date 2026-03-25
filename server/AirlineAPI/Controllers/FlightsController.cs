using AirlineAPI.Data;
using AirlineAPI.DTOs.Flight;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FlightsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FlightsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Flight>>> GetFlights()
        {
            var flights = await _context.Flights
                .OrderBy(f => f.departTime)
                .ToListAsync();

            return Ok(flights);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Flight>> GetFlightById(int id)
        {
            var flight = await _context.Flights.FindAsync(id);

            if (flight == null)
                return NotFound(new { message = "Flight not found" });

            return Ok(flight);
        }

<<<<<<< HEAD
        [HttpPost("/api/add-flights")]
        public async Task<IActionResult> CreateFlight([FromBody] Flight newFlight)
=======
        [HttpPost]
        public async Task<IActionResult> CreateFlight([FromBody] CreateFlightDto dto)
>>>>>>> 4f75e7b96e95b79a745ad055964b8b0b6cbd5ef0
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var validationError = await ValidateFlightAsync(
                dto.AircraftUsed,
                dto.DepartTime,
                dto.ArrivalTime,
                dto.DepartingPortCode,
                dto.ArrivingPortCode,
                null
            );

            if (validationError != null)
                return BadRequest(new { message = validationError });

            var flight = new Flight
            {
                flightNum = dto.FlightNum,
                departTime = dto.DepartTime,
                arrivalTime = dto.ArrivalTime,
                aircraftUsed = dto.AircraftUsed,
                status = dto.Status,
                departingPort = dto.DepartingPortCode,
                arrivingPort = dto.ArrivingPortCode,
                isDomestic = dto.IsDomestic,
                distance = dto.Distance,
                flightChange = dto.FlightChange
            };

            _context.Flights.Add(flight);
            await _context.SaveChangesAsync();

            return Ok(flight);
        }

        [HttpPost("recurring")]
        public async Task<ActionResult> CreateRecurringFlights([FromBody] RecurringScheduleUpsertDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (dto.StartDate.Date > dto.EndDate.Date)
                return BadRequest(new { message = "Start date cannot be after end date." });

            if (dto.DepartingPortCode == dto.ArrivingPortCode)
                return BadRequest(new { message = "Departing and arriving airports cannot be the same." });

            if (dto.DaysOfWeek == null || dto.DaysOfWeek.Count == 0)
                return BadRequest(new { message = "At least one day of week must be selected." });

            var schedule = new RecurringSchedule
            {
                DepartingPort = dto.DepartingPortCode,
                ArrivingPort = dto.ArrivingPortCode,
                DepartureTimeOfDay = dto.DepartureTimeOfDay,
                ArrivalTimeOfDay = dto.ArrivalTimeOfDay,
                AircraftUsed = dto.AircraftUsed,
                Status = dto.Status,
                IsDomestic = dto.IsDomestic,
                Distance = dto.Distance,
                FlightChange = dto.FlightChange,
                StartDate = dto.StartDate.Date,
                EndDate = dto.EndDate.Date,
                DaysOfWeek = string.Join(",", dto.DaysOfWeek.OrderBy(d => d).Distinct())
            };

            _context.RecurringSchedules.Add(schedule);
            await _context.SaveChangesAsync();

            var selectedDays = dto.DaysOfWeek.Distinct().ToHashSet();
            var flightsToCreate = new List<Flight>();

            int nextFlightNum = (_context.Flights.Any())
                ? await _context.Flights.MaxAsync(f => f.flightNum) + 1
                : 1;

            for (var date = dto.StartDate.Date; date <= dto.EndDate.Date; date = date.AddDays(1))
            {
                var dayNum = (int)date.DayOfWeek; // 0=Sun ... 6=Sat

                if (!selectedDays.Contains(dayNum))
                    continue;

                var departDateTime = date.Add(dto.DepartureTimeOfDay);
                var arrivalDateTime = date.Add(dto.ArrivalTimeOfDay);

                if (arrivalDateTime <= departDateTime)
                    arrivalDateTime = arrivalDateTime.AddDays(1);

                var validationError = await ValidateFlightAsync(
                    dto.AircraftUsed,
                    departDateTime,
                    arrivalDateTime,
                    dto.DepartingPortCode,
                    dto.ArrivingPortCode,
                    null
                );

                if (validationError != null)
                {
                    return BadRequest(new
                    {
                        message = $"Could not create recurring flight on {date:yyyy-MM-dd}: {validationError}"
                    });
                }

                flightsToCreate.Add(new Flight
                {
                    flightNum = nextFlightNum++,
                    departTime = departDateTime,
                    arrivalTime = arrivalDateTime,
                    aircraftUsed = dto.AircraftUsed,
                    status = dto.Status,
                    departingPort = dto.DepartingPortCode,
                    arrivingPort = dto.ArrivingPortCode,
                    isDomestic = dto.IsDomestic,
                    distance = dto.Distance,
                    flightChange = dto.FlightChange,
                    recurringScheduleId = schedule.Id
                });
            }

            if (flightsToCreate.Count == 0)
            {
                return BadRequest(new
                {
                    message = "No flights were generated from the selected date range and days of week."
                });
            }

            _context.Flights.AddRange(flightsToCreate);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Recurring schedule created successfully.",
                recurringScheduleId = schedule.Id,
                flightsCreated = flightsToCreate.Count
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateFlight(int id, [FromBody] UpdateFlightDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var flight = await _context.Flights.FindAsync(id);
            if (flight == null)
                return NotFound(new { message = "Flight not found." });

            var validationError = await ValidateFlightAsync(
                dto.AircraftUsed,
                dto.DepartTime,
                dto.ArrivalTime,
                dto.DepartingPortCode,
                dto.ArrivingPortCode,
                id
            );

            if (validationError != null)
                return BadRequest(new { message = validationError });

            flight.departTime = dto.DepartTime;
            flight.arrivalTime = dto.ArrivalTime;
            flight.aircraftUsed = dto.AircraftUsed;
            flight.status = dto.Status;
            flight.departingPort = dto.DepartingPortCode;
            flight.arrivingPort = dto.ArrivingPortCode;
            flight.isDomestic = dto.IsDomestic;
            flight.distance = dto.Distance;
            flight.flightChange = dto.FlightChange;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Flight successfully updated!" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFlight(int id)
        {
            var flight = await _context.Flights.FindAsync(id);

            if (flight == null)
                return NotFound(new { message = "Flight not found." });

            _context.Flights.Remove(flight);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Flight deleted." });
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchByDestination([FromQuery] string dest)
        {
            var results = await _context.Flights
                .Where(f => f.arrivingPort == dest)
                .OrderBy(f => f.departTime)
                .ToListAsync();

            return Ok(results);
        }

        private async Task<string?> ValidateFlightAsync(
            string aircraftUsed,
            DateTime departTime,
            DateTime arrivalTime,
            string departingPortCode,
            string arrivingPortCode,
            int? excludeFlightNum)
        {
            if (arrivalTime <= departTime)
                return "Arrival time must be after departure time.";

            if (departingPortCode == arrivingPortCode)
                return "Departure and arrival airports cannot be the same.";

            var aircraft = await _context.Aircraft.FindAsync(aircraftUsed);
            if (aircraft == null)
                return "Selected aircraft does not exist.";

            var overlappingFlight = await _context.Flights
                .Where(f => f.aircraftUsed == aircraftUsed)
                .Where(f => !excludeFlightNum.HasValue || f.flightNum != excludeFlightNum.Value)
                .Where(f => departTime < f.arrivalTime && arrivalTime > f.departTime)
                .FirstOrDefaultAsync();

            if (overlappingFlight != null)
                return $"Aircraft {aircraftUsed} is already assigned to flight {overlappingFlight.flightNum} during that time.";

            var previousFlight = await _context.Flights
                .Where(f => f.aircraftUsed == aircraftUsed)
                .Where(f => !excludeFlightNum.HasValue || f.flightNum != excludeFlightNum.Value)
                .Where(f => f.arrivalTime <= departTime)
                .OrderByDescending(f => f.arrivalTime)
                .FirstOrDefaultAsync();

            if (previousFlight == null)
            {
                if (!string.Equals(aircraft.currentAirport, departingPortCode, StringComparison.OrdinalIgnoreCase))
                {
                    return $"Aircraft {aircraftUsed} is currently at {aircraft.currentAirport}, so it cannot depart from {departingPortCode}.";
                }
            }
            else
            {
                if (!string.Equals(previousFlight.arrivingPort, departingPortCode, StringComparison.OrdinalIgnoreCase))
                {
                    return $"Aircraft {aircraftUsed} last lands at {previousFlight.arrivingPort}, so its next flight must depart from there.";
                }
            }

            var nextFlight = await _context.Flights
                .Where(f => f.aircraftUsed == aircraftUsed)
                .Where(f => !excludeFlightNum.HasValue || f.flightNum != excludeFlightNum.Value)
                .Where(f => f.departTime >= arrivalTime)
                .OrderBy(f => f.departTime)
                .FirstOrDefaultAsync();

            if (nextFlight != null &&
                !string.Equals(arrivingPortCode, nextFlight.departingPort, StringComparison.OrdinalIgnoreCase))
            {
                return $"This flight would leave the aircraft at {arrivingPortCode}, but its next scheduled departure is from {nextFlight.departingPort}.";
            }

            return null;
        }
    }
}
