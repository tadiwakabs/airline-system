using AirlineAPI.Data;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

    public class PassengerController : ControllerBase
    {
        private readonly AppDbContext _context;
        public PassengerController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet] //get : api/passenger
        public async Task<ActionResult<IEnumerable<Passenger>>>GetAllPassenger()
        {
            var result= await _context.Passenger.ToListAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Passenger>> GetbyPassId(string id)
        {
            var pass= await _context.Passenger.FindAsync(id);

            if (pass== null)
            {
                return NotFound("Passenger not found or wrong ID");
            }

            return Ok(pass);
        }
        
        [HttpGet("by-user/{userId}")]
        public async Task<IActionResult> GetByUserId(string userId)
        {
            var passenger = await _context.Passenger
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (passenger == null)
                return NotFound(new { message = "Passenger profile not found." });

            return Ok(passenger);
        }
    }
}
