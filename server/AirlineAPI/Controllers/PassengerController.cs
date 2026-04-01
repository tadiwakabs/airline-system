using AirlineAPI.Data;
using AirlineAPI.DTOs.User;
using AirlineAPI.Models;
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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Passenger>>> GetAllPassenger()
        {
            var result = await _context.Passenger.ToListAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Passenger>> GetbyPassId(string id)
        {
            var pass = await _context.Passenger.FindAsync(id);

            if (pass == null)
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

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePassenger(string id, [FromBody] UpdatePassengerProfileDto updated)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var passenger = await _context.Passenger.FindAsync(id);

            if (passenger == null)
                return NotFound("Passenger not found");

            passenger.PhoneNumber = updated.PhoneNumber;
            passenger.DLNumber = updated.DLNumber;
            passenger.DLState = updated.DLState;
            passenger.PassportNumber = updated.PassportNumber;
            passenger.PassportCountryCode = updated.PassportCountryCode;
            passenger.PassportExpirationDate = updated.PassportExpirationDate;
            passenger.PlaceOfBirth = updated.PlaceOfBirth;
            passenger.Nationality = updated.Nationality;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Passenger info updated successfully." });
        }

        [HttpPost]
        public async Task<IActionResult> CreatePassenger([FromBody] Passenger newPassenger)
        {
            if (newPassenger == null)
                return BadRequest("Passenger data is required.");

            if (string.IsNullOrWhiteSpace(newPassenger.FirstName))
                return BadRequest("First name is required.");

            if (string.IsNullOrWhiteSpace(newPassenger.LastName))
                return BadRequest("Last name is required.");

            if (newPassenger.DateOfBirth == default)
                return BadRequest("Date of birth is required.");

            if (string.IsNullOrWhiteSpace(newPassenger.PassengerId))
            {
                newPassenger.PassengerId = Guid.NewGuid().ToString("N");
            }

            _context.Passenger.Add(newPassenger);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetbyPassId), new { id = newPassenger.PassengerId }, newPassenger);
        }
    }
}