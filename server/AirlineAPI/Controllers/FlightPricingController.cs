using AirlineAPI.Data;
using AirlineAPI.DTOs.Flight;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/flights/{flightNum}/pricing")]
    public class FlightPricingController : ControllerBase
    {
        private readonly AppDbContext _db;

        public FlightPricingController(AppDbContext db)
        {
            _db = db;
        }

        // GET api/flights/101/pricing
        [HttpGet]
        public async Task<ActionResult<IEnumerable<FlightPricingDto>>> GetPricing(int flightNum)
        {
            var flightExists = await _db.Flights.AnyAsync(f => f.FlightNum == flightNum);
            if (!flightExists)
                return NotFound($"Flight {flightNum} not found.");

            var pricing = await _db.FlightPricing
                .Where(p => p.FlightNum == flightNum)
                .Select(p => new FlightPricingDto
                {
                    CabinClass = p.CabinClass.ToString(),
                    Price = p.Price
                })
                .ToListAsync();

            return Ok(pricing);
        }

        // PUT api/flights/101/pricing
        // Creates all three cabin prices on first use, updates them on subsequent calls.
        [HttpPut]
        public async Task<IActionResult> UpsertPricing(int flightNum, [FromBody] UpsertFlightPricingDto dto)
        {
            var flightExists = await _db.Flights.AnyAsync(f => f.FlightNum == flightNum);
            if (!flightExists)
                return NotFound($"Flight {flightNum} not found.");

            if (dto.EconomyPrice <= 0 || dto.BusinessPrice <= 0 || dto.FirstPrice <= 0)
                return BadRequest("All prices must be greater than zero.");

            if (dto.EconomyPrice >= dto.BusinessPrice || dto.BusinessPrice >= dto.FirstPrice)
                return BadRequest("Prices must follow the order: Economy < Business < First.");

            var entries = new[]
            {
                new FlightPricing { FlightNum = flightNum, CabinClass = CabinClass.Economy, Price = dto.EconomyPrice },
                new FlightPricing { FlightNum = flightNum, CabinClass = CabinClass.Business, Price = dto.BusinessPrice },
                new FlightPricing { FlightNum = flightNum, CabinClass = CabinClass.First,    Price = dto.FirstPrice },
            };

            foreach (var entry in entries)
            {
                var existing = await _db.FlightPricing
                    .FirstOrDefaultAsync(p => p.FlightNum == flightNum && p.CabinClass == entry.CabinClass);

                if (existing is null)
                    _db.FlightPricing.Add(entry);
                else
                    existing.Price = entry.Price;
            }

            await _db.SaveChangesAsync();
            return NoContent();
        }
    }
}
