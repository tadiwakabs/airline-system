using AirlineAPI.Data;
using AirlineAPI.DTOs.Flights;
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

        [HttpPost]
        public async Task<IActionResult> CreateFlight([FromBody] CreateFlightDto dto)
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
        public async Task<IActionResult> CreateRecurringFlights([FromBody] CreateRecurringFlightDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (dto.EndDate.Date < dto.StartDate.Date)
                return BadRequest(new { message = "End date must be on or after start date." });

            if (dto.DaysOfWeek == null || dto.DaysOfWeek.Count == 0)
                return BadRequest(new { message = "Select at least one day of the week." });

            int nextFlightNum = await _context.Flights.AnyAsync()
                ? await _context.Flights.MaxAsync(f => f.flightNum) + 1
                : 1;

            var createdFlights = new List<Flight>();

            for (var date = dto.StartDate.Date; date <= dto.EndDate.Date; date = date.AddDays(1))
            {
                if (!dto.DaysOfWeek.Contains(date.DayOfWeek))
                    continue;

                var depart = date.Add(dto.DepartureTimeOfDay);
                var arrive = date.Add(dto.ArrivalTimeOfDay);

                if (arrive <= depart)
                    arrive = arrive.AddDays(1);

                var validationError = await ValidateFlightAsync(
                    dto.AircraftUsed,
                    depart,
                    arrive,
                    dto.DepartingPortCode,
                    dto.ArrivingPortCode,
                    null
                );

                if (validationError != null)
                {
                    return BadRequest(new
                    {
                        message = $"Recurring generation failed on {date:yyyy-MM-dd}: {validationError}"
                    });
                }

                var flight = new Flight
                {
                    flightNum = nextFlightNum++,
                    departTime = depart,
                    arrivalTime = arrive,
                    aircraftUsed = dto.AircraftUsed,
                    status = dto.Status,
                    departingPort = dto.DepartingPortCode,
                    arrivingPort = dto.ArrivingPortCode,
                    isDomestic = dto.IsDomestic,
                    distance = dto.Distance,
                    flightChange = dto.FlightChange
                };

                createdFlights.Add(flight);
            }

            _context.Flights.AddRange(createdFlights);
            await _context.SaveChangesAsync();

            return Ok(createdFlights);
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
