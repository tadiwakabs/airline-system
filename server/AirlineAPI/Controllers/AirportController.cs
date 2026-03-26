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
        
        [HttpPost]
        public async Task<ActionResult<Airport>> PostAirport(Airport airport)
        {
            try 
            {
                //custom validation (check length and duplicates)
                var validationError = await ValidateAirport(airport);
                if (validationError != null)
                {
                    return BadRequest(new { message = validationError });
                }

                // 2. Clear navigation properties (Prevents from trying to recreate Countries/States)
                airport.States = null;
                airport.Countries = null;

                _context.Airports.Add(airport);
                await _context.SaveChangesAsync();
                
                return CreatedAtAction("GetAirport", new { id = airport.airportCode }, airport);
            }
            catch (Exception ex) 
            {
                Console.WriteLine("DATABASE ERROR: " + ex.InnerException?.Message);
                return BadRequest(new { message = ex.InnerException?.Message ?? ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult>DeleteAirport(string id)
        {
            var port = await _context.Airports.FindAsync(id);
            if (port == null)
                return NotFound(new { message = "Airport Not Found" });
            
            bool hasFlights = await _context.Flights.AnyAsync(f => 
            f.departingPort == id || f.arrivingPort == id);
            if (hasFlights)
            {
                return BadRequest(new { 
                    message = $"Cannot delete {id}. There are existing flights scheduled for this airport." 
                });
            }
            _context.Airports.Remove(port);
            await _context.SaveChangesAsync();
            return Ok(new{message= "Airport deleted"});
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