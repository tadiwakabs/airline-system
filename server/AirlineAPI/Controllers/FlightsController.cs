using AirlineAPI.Data;
using AirlineAPI.DTOs.Flight;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;

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
        public async Task<ActionResult<IEnumerable<FlightResponseDto>>> GetFlights()
        {
            var flights = await _context.Flights
                .Include(f => f.Pricing)
                .OrderBy(f => f.departTime)
                .ToListAsync();

            var response = flights.Select(f => new FlightResponseDto
            {
                FlightNum             = f.flightNum,
                DepartTime            = f.departTime,
                ArrivalTime           = f.arrivalTime,
                ScheduledDepartLocal  = f.scheduledDepartLocal ?? f.departTime,
                ScheduledArrivalLocal = f.scheduledArrivalLocal ?? f.arrivalTime,
                AircraftUsed          = f.aircraftUsed,
                Status                = f.status,
                DepartingPortCode     = f.departingPort,
                ArrivingPortCode      = f.arrivingPort,
                IsDomestic            = f.isDomestic,
                Distance              = f.distance,
                FlightChange          = f.flightChange,
                RecurringScheduleId   = f.recurringScheduleId,
                Pricing               = f.Pricing.Select(p => new FlightPricingDto
                {
                    CabinClass = p.CabinClass.ToString(),
                    Price      = p.Price
                }).ToList()
            });

            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<FlightResponseDto>> GetFlightById(int id)
        {
            var flight = await _context.Flights
                .Include(f => f.Pricing)
                .FirstOrDefaultAsync(f => f.flightNum == id);

            if (flight == null)
                return NotFound(new { message = "Flight not found" });

            var response = new FlightResponseDto
            {
                FlightNum          = flight.flightNum,
                DepartTime         = flight.departTime,
                ArrivalTime        = flight.arrivalTime,
                ScheduledDepartLocal  = flight.scheduledDepartLocal ?? flight.departTime,
                ScheduledArrivalLocal = flight.scheduledArrivalLocal ?? flight.arrivalTime,
                AircraftUsed       = flight.aircraftUsed,
                Status             = flight.status,
                DepartingPortCode  = flight.departingPort,
                ArrivingPortCode   = flight.arrivingPort,
                IsDomestic         = flight.isDomestic,
                Distance           = flight.distance,
                FlightChange       = flight.flightChange,
                RecurringScheduleId = flight.recurringScheduleId,
                Pricing            = flight.Pricing.Select(p => new FlightPricingDto
                {
                    CabinClass = p.CabinClass.ToString(),
                    Price      = p.Price
                }).ToList()
            };

            return Ok(response);
        }

        [HttpPost]
        public async Task<IActionResult> CreateFlight([FromBody] CreateFlightDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var airports = await GetFlightAirportsAsync(dto.DepartingPortCode, dto.ArrivingPortCode);
            if (airports == null)
                return BadRequest(new { message = "One or both airports are invalid, or missing timezone data." });

            var departUtc = ConvertLocalToUtc(dto.ScheduledDepartLocal, airports.Value.dep.timezone!);
            var arrivalUtc = ConvertLocalToUtc(dto.ScheduledArrivalLocal, airports.Value.arr.timezone!);

            var validationError = await ValidateFlightAsync(
                dto.AircraftUsed,
                departUtc,
                arrivalUtc,
                dto.DepartingPortCode,
                dto.ArrivingPortCode,
                null
            );

            if (validationError != null)
                return BadRequest(new { message = validationError });

            var flight = new Flight
            {
                flightNum = dto.FlightNum,
                departTime = departUtc,
                arrivalTime = arrivalUtc,
                scheduledDepartLocal = dto.ScheduledDepartLocal,
                scheduledArrivalLocal = dto.ScheduledArrivalLocal,
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

            var aircraft = await _context.Aircraft
                .FirstOrDefaultAsync(a => a.tailnumber == flight.aircraftUsed);

            if (aircraft == null)
                return BadRequest("Assigned aircraft not found.");

            var seats = GenerateSeatsForFlight(flight.flightNum, aircraft.numSeats);

            _context.Seating.AddRange(seats);
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

            if (dto.EconomyPrice.HasValue || dto.BusinessPrice.HasValue || dto.FirstPrice.HasValue)
            {
                if (!dto.EconomyPrice.HasValue || !dto.BusinessPrice.HasValue || !dto.FirstPrice.HasValue)
                    return BadRequest(new { message = "All three prices must be provided together." });

                if (dto.EconomyPrice <= 0 || dto.BusinessPrice <= 0 || dto.FirstPrice <= 0)
                    return BadRequest(new { message = "All prices must be greater than zero." });

                if (dto.EconomyPrice >= dto.BusinessPrice || dto.BusinessPrice >= dto.FirstPrice)
                    return BadRequest(new { message = "Prices must follow the order: Economy < Business < First." });
            }
            
            var airports = await GetFlightAirportsAsync(dto.DepartingPortCode, dto.ArrivingPortCode);
            if (airports == null)
                return BadRequest(new { message = "One or both airports are invalid, or missing timezone data." });

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

                var scheduledDepartLocal = date.Add(dto.DepartureTimeOfDay);
                var scheduledArrivalLocal = date.Add(dto.ArrivalTimeOfDay);

                if (scheduledArrivalLocal <= scheduledDepartLocal)
                    scheduledArrivalLocal = scheduledArrivalLocal.AddDays(1);

                var departUtc = ConvertLocalToUtc(scheduledDepartLocal, airports.Value.dep.timezone!);
                var arrivalUtc = ConvertLocalToUtc(scheduledArrivalLocal, airports.Value.arr.timezone!);

                var validationError = await ValidateFlightAsync(
                    dto.AircraftUsed,
                    departUtc,
                    arrivalUtc,
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
            
            var aircraft = await _context.Aircraft
                .FirstOrDefaultAsync(a => a.tailnumber == dto.AircraftUsed);

            if (aircraft == null)
                return BadRequest("Assigned aircraft not found.");

            var allSeats = new List<Seating>();

            foreach (var flight in flightsToCreate)
            {
                var seats = GenerateSeatsForFlight(flight.flightNum, aircraft.numSeats);
                allSeats.AddRange(seats);
            }

            _context.Seating.AddRange(allSeats);
            await _context.SaveChangesAsync();

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

            var airports = await GetFlightAirportsAsync(dto.DepartingPortCode, dto.ArrivingPortCode);
            if (airports == null)
                return BadRequest(new { message = "One or both airports are invalid, or missing timezone data." });

            var departUtc = ConvertLocalToUtc(dto.ScheduledDepartLocal, airports.Value.dep.timezone!);
            var arrivalUtc = ConvertLocalToUtc(dto.ScheduledArrivalLocal, airports.Value.arr.timezone!);

            var validationError = await ValidateFlightAsync(
                dto.AircraftUsed,
                departUtc,
                arrivalUtc,
                dto.DepartingPortCode,
                dto.ArrivingPortCode,
                id
            );

            if (validationError != null)
                return BadRequest(new { message = validationError });

            flight.departTime = departUtc;
            flight.arrivalTime = arrivalUtc;
            flight.scheduledDepartLocal = dto.ScheduledDepartLocal;
            flight.scheduledArrivalLocal = dto.ScheduledArrivalLocal;
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

        [HttpPut("{id}/cancel")]
public async Task<IActionResult> CancelFlight(int id)
{
    var flight = await _context.Flights.FindAsync(id);

    if (flight == null)
    {
        return NotFound(new { message = "Flight not found." });
    }

    if (flight.status == "Cancelled")
    {
        return BadRequest(new { message = "Flight is already cancelled." });
    }

    flight.status = "Cancelled";

    await _context.SaveChangesAsync();

    return Ok(new { message = "Flight cancelled successfully." });
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

        [HttpGet("search-results")]
        public async Task<IActionResult> SearchResults(
            [FromQuery] string from,
            [FromQuery] string to,
            [FromQuery] DateTime date,
            [FromQuery] int adults = 1,
            [FromQuery] int children = 0,
            [FromQuery] int infants = 0)
        {
            if (adults < 1)
                return BadRequest(new { message = "At least one adult is required." });

            if (children < 0 || infants < 0)
                return BadRequest(new { message = "Passenger counts cannot be negative." });

            from = (from ?? "").Trim().ToUpper();
            to = (to ?? "").Trim().ToUpper();

            var dayStart = date.Date;
            var dayEnd = dayStart.AddDays(1);

            var allFlights = await _context.Flights
                .Include(f => f.Pricing)
                .OrderBy(f => f.departTime)
                .ToListAsync();

            var directResults = allFlights
                .Where(f =>
                    (f.departingPort ?? "").Trim().ToUpper() == from &&
                    (f.arrivingPort ?? "").Trim().ToUpper() == to &&
                    f.scheduledDepartLocal.HasValue &&
                    f.scheduledDepartLocal.Value.Date == dayStart)
                .Select(f =>
                {
                    var economyBase = f.Pricing.FirstOrDefault(p => p.CabinClass == CabinClass.Economy)?.Price;
                    var businessBase = f.Pricing.FirstOrDefault(p => p.CabinClass == CabinClass.Business)?.Price;
                    var firstBase = f.Pricing.FirstOrDefault(p => p.CabinClass == CabinClass.First)?.Price;

                    return new FlightSearchResultDto
                    {
                        Type = "direct",
                        Flights = new List<FlightLegDto>
                        {
                            new FlightLegDto
                            {
                                FlightNum = f.flightNum,
                                DepartingPortCode = f.departingPort,
                                ArrivingPortCode = f.arrivingPort,
                                DepartTime = f.scheduledDepartLocal ?? f.departTime,
                                ArrivalTime = f.scheduledArrivalLocal ?? f.arrivalTime,
                                DepartTimeUtc = f.departTime,
                                ArrivalTimeUtc = f.arrivalTime,
                                Status = f.status,
                                AircraftUsed = f.aircraftUsed,
                                Distance = f.distance,
                                IsDomestic = f.isDomestic,
                                IsFull = !_context.Seating.Any(s =>
                                s.flightNum == f.flightNum &&
                                s.seatStatus == SeatStatus.Available)
                            }
                        },
                        Pricing = new FlightSearchPricingDto
                        {
                            Economy = economyBase,
                            Business = businessBase,
                            First = firstBase
                        },
                        Quote = BuildQuote(economyBase, businessBase, firstBase, adults, children, infants)
                    };
                })
                .ToList();

            var candidateFirstLegs = allFlights
                .Where(f =>
                    (f.departingPort ?? "").Trim().ToUpper() == from &&
                    (f.arrivingPort ?? "").Trim().ToUpper() != to &&
                    f.scheduledDepartLocal.HasValue &&
                    f.scheduledDepartLocal.Value.Date == dayStart)
                .ToList();

            var candidateSecondLegs = allFlights
                .Where(f =>
                    (f.departingPort ?? "").Trim().ToUpper() != from &&
                    (f.arrivingPort ?? "").Trim().ToUpper() == to &&
                    f.scheduledDepartLocal.HasValue &&
                    f.scheduledDepartLocal.Value.Date >= dayStart &&
                    f.scheduledDepartLocal.Value.Date < dayEnd.AddDays(1))
                .ToList();

            // Load airports for geographic filtering
            var relevantCodes = candidateFirstLegs
                .Select(f => f.arrivingPort)
                .Distinct()
                .ToList();

            var layoverAirports = await _context.Airports
                .Where(a => relevantCodes.Contains(a.airportCode))
                .ToDictionaryAsync(a => a.airportCode);

            var originAirport = await _context.Airports.FindAsync(from);
            var destAirport = await _context.Airports.FindAsync(to);

            var connectingResults = new List<FlightSearchResultDto>();

            if (originAirport != null && destAirport != null)
            {
                double originLat = (double)originAirport.latitude;
                double originLon = (double)originAirport.longitude;
                double destLat = (double)destAirport.latitude;
                double destLon = (double)destAirport.longitude;

                double directDist = HaversineKm(originLat, originLon, destLat, destLon);

                connectingResults =
                    (from leg1 in candidateFirstLegs
                        from leg2 in candidateSecondLegs
                        where (leg1.arrivingPort ?? "").Trim().ToUpper() == (leg2.departingPort ?? "").Trim().ToUpper()
                              && leg2.departTime >= leg1.arrivalTime.AddMinutes(40)
                              && leg2.departTime <= leg1.arrivalTime.AddHours(4)
                              && layoverAirports.ContainsKey(leg1.arrivingPort!)
                        let layover = layoverAirports[leg1.arrivingPort]
                        let layoverLat = (double)layover.latitude
                        let layoverLon = (double)layover.longitude
                        // Layover must be closer to destination than origin is
                        let distLayoverToDest = HaversineKm(layoverLat, layoverLon, destLat, destLon)
                        // Total route distance must not exceed 1.4x the direct distance
                        let distOriginToLayover = HaversineKm(originLat, originLon, layoverLat, layoverLon)
                        where distLayoverToDest < directDist // no backtracking
                              && (distOriginToLayover + distLayoverToDest) <= directDist * 1.4 // no absurd detours
                        select new
                        {
                            leg1, leg2,
                            economyBase = SumPrices(
                                leg1.Pricing.FirstOrDefault(p => p.CabinClass == CabinClass.Economy)?.Price,
                                leg2.Pricing.FirstOrDefault(p => p.CabinClass == CabinClass.Economy)?.Price),
                            businessBase = SumPrices(
                                leg1.Pricing.FirstOrDefault(p => p.CabinClass == CabinClass.Business)?.Price,
                                leg2.Pricing.FirstOrDefault(p => p.CabinClass == CabinClass.Business)?.Price),
                            firstBase = SumPrices(
                                leg1.Pricing.FirstOrDefault(p => p.CabinClass == CabinClass.First)?.Price,
                                leg2.Pricing.FirstOrDefault(p => p.CabinClass == CabinClass.First)?.Price)
                        })
                    .Select(x => new FlightSearchResultDto
                    {
                        Type = "connection",
                        Flights = new List<FlightLegDto>
                        {
                            new FlightLegDto
                            {
                                FlightNum = x.leg1.flightNum,
                                DepartingPortCode = x.leg1.departingPort,
                                ArrivingPortCode = x.leg1.arrivingPort,
                                DepartTime = x.leg1.scheduledDepartLocal ?? x.leg1.departTime,
                                ArrivalTime = x.leg1.scheduledArrivalLocal ?? x.leg1.arrivalTime,
                                DepartTimeUtc = x.leg1.departTime,
                                ArrivalTimeUtc = x.leg1.arrivalTime,
                                Status = x.leg1.status,
                                AircraftUsed = x.leg1.aircraftUsed,
                                Distance = x.leg1.distance,
                                IsDomestic = x.leg1.isDomestic,
                                IsFull = !_context.Seating.Any(s =>
                                    s.flightNum == x.leg1.flightNum &&
                                    s.seatStatus == SeatStatus.Available)
                            },
                            new FlightLegDto
                            {
                                FlightNum = x.leg2.flightNum,
                                DepartingPortCode = x.leg2.departingPort,
                                ArrivingPortCode = x.leg2.arrivingPort,
                                DepartTime = x.leg2.scheduledDepartLocal ?? x.leg2.departTime,
                                ArrivalTime = x.leg2.scheduledArrivalLocal ?? x.leg2.arrivalTime,
                                DepartTimeUtc = x.leg2.departTime,
                                ArrivalTimeUtc = x.leg2.arrivalTime,
                                Status = x.leg2.status,
                                AircraftUsed = x.leg2.aircraftUsed,
                                Distance = x.leg2.distance,
                                IsDomestic = x.leg2.isDomestic,
                                IsFull = !_context.Seating.Any(s =>
                                    s.flightNum == x.leg2.flightNum &&
                                    s.seatStatus == SeatStatus.Available)
                            }
                        },
                        Pricing = new FlightSearchPricingDto
                            { Economy = x.economyBase, Business = x.businessBase, First = x.firstBase },
                        Quote = BuildQuote(x.economyBase, x.businessBase, x.firstBase, adults, children, infants)
                    })
                    .ToList();
            }

            return Ok(directResults.Concat(connectingResults));
        }

        private const decimal ChildMultiplier = 0.8m;
        private const decimal InfantMultiplier = 0.1m;

        private static decimal? SumPrices(decimal? first, decimal? second)
        {
            if (!first.HasValue || !second.HasValue)
                return null;

            return first.Value + second.Value;
        }

        private static FlightFareBreakdownDto BuildFareBreakdown(
            decimal? baseFare,
            int adults,
            int children,
            int infants)
        {
            if (!baseFare.HasValue)
                return new FlightFareBreakdownDto();

            var perAdult = baseFare.Value;
            var perChild = Math.Round(baseFare.Value * ChildMultiplier, 2);
            var perInfant = Math.Round(baseFare.Value * InfantMultiplier, 2);

            var total =
                (adults * perAdult) +
                (children * perChild) +
                (infants * perInfant);

            return new FlightFareBreakdownDto
            {
                PerAdult = perAdult,
                PerChild = perChild,
                PerInfant = perInfant,
                Total = Math.Round(total, 2)
            };
        }

        private static FlightSearchQuoteDto BuildQuote(
            decimal? economyBase,
            decimal? businessBase,
            decimal? firstBase,
            int adults,
            int children,
            int infants)
        {
            return new FlightSearchQuoteDto
            {
                Economy = BuildFareBreakdown(economyBase, adults, children, infants),
                Business = BuildFareBreakdown(businessBase, adults, children, infants),
                First = BuildFareBreakdown(firstBase, adults, children, infants)
            };
        }
        
        private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371.0;
            var dLat = (lat2 - lat1) * Math.PI / 180.0;
            var dLon = (lon2 - lon1) * Math.PI / 180.0;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                    + Math.Cos(lat1 * Math.PI / 180.0) * Math.Cos(lat2 * Math.PI / 180.0)
                                                       * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
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
            // Linux / MySQL IANA names like America/Chicago should work on your LXC
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
