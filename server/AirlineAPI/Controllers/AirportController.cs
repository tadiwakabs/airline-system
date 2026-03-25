using AirlineAPI.Data;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class AirportController:ControllerBase
    {
        private readonly AppDbContext _context;
        public AirportController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Airport>>> GetAirport()
        {
            var ports= await _context.Airports.ToListAsync();
            return Ok(ports);
        }

        [HttpPost()]
        public async Task<IActionResult>CreateAirport([FromBody] Airport airport)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var problem = await ValidateAirport(airport);
            if (problem != null ) 
                return BadRequest(new{ message= problem});

            airport.States=null;
            airport.Countries= null;

            _context.Airports.Add(airport);
            await _context.SaveChangesAsync();
            return Ok(airport);
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAirport(string id, [FromBody] Airport airport)
        {
            if (id != airport.airportCode)
            {
                return BadRequest(new { message = "Mismatched Airport Code" });
            }

            var error = await ValidateAirport(airport, id);
            if (error != null)
            {
                return BadRequest(new { message = error });
            }  
            _context.Entry(airport).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                
                if (!_context.Airports.Any(a => a.airportCode == id))
                {
                    return NotFound(new { message = "Airport not found" });
                }
                else
                {
                    throw; 
                }
            }
            return Ok(new { message = "Airport successfully updated!" });
        }

        private async Task<string?> ValidateAirport(Airport airport, string? currentId= null)
        {
            if (airport.airportCode.Length!=3)
                return "Airport code must be exactly 3 characters.";
            
            if (currentId==null)
            {
                bool exists = await _context.Airports.AnyAsync(a=>a.airportCode==airport.airportCode);
                if (exists)
                    return $"Airport code {airport.airportCode} is already taken.";
            }
            return null;
        }
    }
}