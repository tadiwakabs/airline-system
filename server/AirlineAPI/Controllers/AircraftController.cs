using AirlineAPI.Data;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // URL: api/aircraft
    public class AircraftController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AircraftController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/aircraft
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Aircraft>>> GetAllAircraft()
        {
            var aircraft = await _context.Aircraft.ToListAsync();
            return Ok(aircraft);
        }

        // GET: api/aircraft/N12345
        [HttpGet("{tailnumber}")]
        public async Task<ActionResult<Aircraft>> GetAircraftByTail(string tailnumber)
        {
            var aircraft = await _context.Aircraft.FindAsync(tailnumber);

            if (aircraft == null)
                return NotFound(new { message = "Aircraft not found" });

            return Ok(aircraft);
        }

        // POST: api/aircraft
        [HttpPost]
        public async Task<IActionResult> CreateAircraft([FromBody] Aircraft newAircraft)
        {
            if (newAircraft == null)
                return BadRequest("Aircraft data is missing!");

            _context.Aircraft.Add(newAircraft);
            await _context.SaveChangesAsync();
            return Ok(newAircraft);
        }

        // PUT: api/aircraft/N12345
        [HttpPut("{tailnumber}")]
        public async Task<IActionResult> UpdateAircraft(string tailnumber, [FromBody] Aircraft updatedAircraft)
        {
            if (tailnumber != updatedAircraft.tailnumber)
                return BadRequest("Tail number mismatch");

            _context.Entry(updatedAircraft).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return Ok("Aircraft successfully updated!");
        }

        // DELETE: api/aircraft/N12345
        [HttpDelete("{tailnumber}")]
        public async Task<IActionResult> DeleteAircraft(string tailnumber)
        {
            var aircraft = await _context.Aircraft.FindAsync(tailnumber);

            if (aircraft == null)
                return NotFound("Aircraft not found.");

            _context.Aircraft.Remove(aircraft);
            await _context.SaveChangesAsync();
            return Ok("Aircraft deleted.");
        }
    }
}