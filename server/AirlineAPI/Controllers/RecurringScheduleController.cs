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
            var now = DateTime.Now;

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

                var departDateTime = date.Add(dto.DepartureTimeOfDay);
                var arrivalDateTime = date.Add(dto.ArrivalTimeOfDay);

                if (arrivalDateTime <= departDateTime)
                    arrivalDateTime = arrivalDateTime.AddDays(1);

                // optional: skip already-past departures
                if (departDateTime < now)
                    continue;

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
                    recurringScheduleId = id
                });
            }

            _context.Flights.AddRange(flightsToCreate);
            await _context.SaveChangesAsync();

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
            
            // If deleteFlights == true -> delete future flights tied to this schedule
            var now = DateTime.Now;

            var futureFlights = await _context.Flights
                .Where(f => f.recurringScheduleId == id && f.departTime >= now)
                .ToListAsync();

            _context.Flights.RemoveRange(futureFlights);
            
            // Else, unlink them by setting recurringScheduleId = null
            var linkedFlights = await _context.Flights
                .Where(f => f.recurringScheduleId == id)
                .ToListAsync();

            foreach (var flight in linkedFlights)
            {
                flight.recurringScheduleId = null;
            }

            _context.RecurringSchedules.Remove(schedule);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = deleteFlights
                    ? "Recurring schedule and future flights deleted."
                    : "Recurring schedule deleted. Future flights should be unlinked."
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
    }
}
