using AirlineAPI.Data;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AircraftController : ControllerBase
    {
        private readonly AppDbContext _context;
        public AircraftController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Aircraft>>> GetAircraft()
        {
            var aircraft = await _context.Aircraft.ToListAsync();
            return Ok(aircraft);
        }

        [HttpGet("{tailNum}")]
        public async Task<ActionResult<Aircraft>> GetAircraftByTailNum(string tailNum)
        {
            var aircraft = await _context.Aircraft.FindAsync(tailNum);

            if (aircraft == null)
            {
                return NotFound(new { message = "Aircraft not found."});
            }
            return Ok(aircraft);
        }

        [HttpPost]
        public async Task<IActionResult> AddAircraft([FromBody] Aircraft newAircraft)
        {
            if (newAircraft == null)
            {
                return BadRequest("Missing data for new aircraft.");
            }

            _context.Aircraft.Add(newAircraft);

            await _context.SaveChangesAsync();

            return Ok(newAircraft);
        }

        [HttpPut("{tailNum}")]
        public async Task<IActionResult> UpdateAircraft(string tailNum, [FromBody] Aircraft updatedAircaft)
        {
            if (tailNum! == updatedAircaft.tailnumber)
            {
                return BadRequest("Tail number is mismatched");
            }
            //_context.Entry(updatedAircaft).
            await _context.SaveChangesAsync();
            return Ok("Aircraft updated");
        }

        [HttpDelete("{tailNum}")]
        public async Task<IActionResult> DeleteAircraft(string tailNum, [FromBody] Aircraft deletedAircraft)
        {
            var aircraft = await _context.Aircraft.FindAsync();

            if (aircraft == null)
            {
                return NotFound("Aircraft not found.");
            }

            _context.Aircraft.Remove(aircraft);
            await _context.SaveChangesAsync();
            return Ok("Aircraft successfully deleted");
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchByTailNum([FromQuery] string tailNum)
        {
            var results = await _context.Aircraft.Where(f=> f.tailnumber == tailNum).ToListAsync();

            return Ok(results);
        }
    }
}