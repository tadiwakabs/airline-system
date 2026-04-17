using System.Security.Claims;
using AirlineAPI.Data;
using AirlineAPI.DTOs.User;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PassengerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PassengerController(AppDbContext context)
        {
            _context = context;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirst("sub")?.Value
                   ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
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
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Invalid token." });

            var pass = await _context.Passenger.FindAsync(id);

            if (pass == null)
                return NotFound(new { message = "Passenger not found." });

            var canAccess =
                pass.UserId == userId ||
                pass.OwnerUserId == userId;

            if (!canAccess)
                return Forbid();

            return Ok(pass);
        }

        [HttpGet("by-user/{userId}")]
        public async Task<IActionResult> GetByUserId(string userId)
        {
            var currentUserId = GetCurrentUserId();
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized(new { message = "Invalid token." });

            if (currentUserId != userId)
                return Forbid();

            var passenger = await _context.Passenger
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (passenger == null)
                return NotFound(new { message = "Passenger profile not found." });

            return Ok(passenger);
        }

        [HttpGet("saved")]
        public async Task<IActionResult> GetSavedPassengers()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Invalid token." });

            var passengers = await _context.Passenger
                .Where(p => p.OwnerUserId == userId && p.UserId == null)
                .OrderBy(p => p.FirstName)
                .ThenBy(p => p.LastName)
                .ToListAsync();

            return Ok(passengers.Select(ToSavedPassengerDto));
        }

        [HttpPost("saved")]
        public async Task<IActionResult> CreateSavedPassenger([FromBody] CreateSavedPassengerDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Invalid token." });

            var passenger = new Passenger
            {
                PassengerId = Guid.NewGuid().ToString("N"),
                UserId = null,
                OwnerUserId = userId,
                Title = ParseTitle(request.Title),
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                DateOfBirth = request.DateOfBirth,
                Gender = ParseGender(request.Gender),
                PhoneNumber = NormalizePhone(request.PassengerType, request.PhoneNumber),
                Email = NormalizeEmail(request.PassengerType, request.Email),
                DLNumber = request.DLNumber,
                DLState = request.DLState,
                PassportNumber = request.PassportNumber,
                PassportCountryCode = request.PassportCountryCode,
                PassportExpirationDate = request.PassportExpirationDate,
                PlaceOfBirth = request.PlaceOfBirth,
                Nationality = request.Nationality,
                PassengerType = ParsePassengerType(request.PassengerType),
            };

            _context.Passenger.Add(passenger);
            await _context.SaveChangesAsync();

            return Ok(ToSavedPassengerDto(passenger));
        }

        [HttpPut("saved/{id}")]
        public async Task<IActionResult> UpdateSavedPassenger(string id, [FromBody] UpdateSavedPassengerDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Invalid token." });

            var passenger = await _context.Passenger.FirstOrDefaultAsync(p => p.PassengerId == id);

            if (passenger == null)
                return NotFound(new { message = "Passenger not found." });

            if (passenger.OwnerUserId != userId || passenger.UserId != null)
                return Forbid();

            passenger.Title = ParseTitle(request.Title);
            passenger.FirstName = request.FirstName.Trim();
            passenger.LastName = request.LastName.Trim();
            passenger.DateOfBirth = request.DateOfBirth;
            passenger.Gender = ParseGender(request.Gender);
            passenger.PhoneNumber = NormalizePhone(request.PassengerType, request.PhoneNumber);
            passenger.Email = NormalizeEmail(request.PassengerType, request.Email);
            passenger.DLNumber = request.DLNumber;
            passenger.DLState = request.DLState;
            passenger.PassportNumber = request.PassportNumber;
            passenger.PassportCountryCode = request.PassportCountryCode;
            passenger.PassportExpirationDate = request.PassportExpirationDate;
            passenger.PlaceOfBirth = request.PlaceOfBirth;
            passenger.Nationality = request.Nationality;
            passenger.PassengerType = ParsePassengerType(request.PassengerType);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Saved passenger updated successfully.",
                passenger = ToSavedPassengerDto(passenger)
            });
        }

        [HttpDelete("saved/{id}")]
        public async Task<IActionResult> DeleteSavedPassenger(string id)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Invalid token." });

            var passenger = await _context.Passenger.FirstOrDefaultAsync(p => p.PassengerId == id);

            if (passenger == null)
                return NotFound(new { message = "Passenger not found." });

            if (passenger.OwnerUserId != userId || passenger.UserId != null)
                return Forbid();

            _context.Passenger.Remove(passenger);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Saved passenger deleted successfully." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePassenger(string id, [FromBody] UpdatePassengerProfileDto updated)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Invalid token." });

            var passenger = await _context.Passenger.FindAsync(id);

            if (passenger == null)
                return NotFound(new { message = "Passenger not found." });

            var canEdit =
                passenger.UserId == userId ||
                passenger.OwnerUserId == userId;

            if (!canEdit)
                return Forbid();

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
                return BadRequest(new { message = "Passenger data is required." });

            var currentUserId = GetCurrentUserId();
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized(new { message = "Invalid token." });

            if (string.IsNullOrWhiteSpace(newPassenger.FirstName))
                return BadRequest(new { message = "First name is required." });

            if (string.IsNullOrWhiteSpace(newPassenger.LastName))
                return BadRequest(new { message = "Last name is required." });

            if (newPassenger.DateOfBirth == default)
                return BadRequest(new { message = "Date of birth is required." });

            if (string.IsNullOrWhiteSpace(newPassenger.PassengerId))
                newPassenger.PassengerId = Guid.NewGuid().ToString("N");

            if (newPassenger.UserId == currentUserId)
            {
                newPassenger.OwnerUserId = currentUserId;
            }
            else
            {
                newPassenger.UserId = null;
                newPassenger.OwnerUserId = null;
            }

            if (newPassenger.PassengerType != PassengerType.Adult)
            {
                newPassenger.PhoneNumber = null;
                newPassenger.Email = null;
            }

            _context.Passenger.Add(newPassenger);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetbyPassId), new { id = newPassenger.PassengerId }, newPassenger);
        }

        private static SavedPassengerDto ToSavedPassengerDto(Passenger p) => new SavedPassengerDto
        {
            PassengerId = p.PassengerId,
            OwnerUserId = p.OwnerUserId,
            Title = p.Title?.ToString(),
            FirstName = p.FirstName,
            LastName = p.LastName,
            DateOfBirth = p.DateOfBirth,
            Gender = p.Gender?.ToString(),
            PhoneNumber = p.PhoneNumber,
            Email = p.Email,
            DLNumber = p.DLNumber,
            DLState = p.DLState,
            PassportNumber = p.PassportNumber,
            PassportCountryCode = p.PassportCountryCode,
            PassportExpirationDate = p.PassportExpirationDate,
            PlaceOfBirth = p.PlaceOfBirth,
            Nationality = p.Nationality,
            PassengerType = p.PassengerType.ToString(),
        };

        private static UserTitle? ParseTitle(string? title)
        {
            if (string.IsNullOrWhiteSpace(title)) return null;

            return title switch
            {
                "Dr" => UserTitle.Dr,
                "Ms" => UserTitle.Ms,
                "Mr" => UserTitle.Mr,
                "Miss" => UserTitle.Miss,
                "Mrs" => UserTitle.Mrs,
                "Mstr" => UserTitle.Mstr,
                "Prof" => UserTitle.Prof,
                "Rev" => UserTitle.Rev,
                _ => null
            };
        }

        private static Gender? ParseGender(string? gender)
        {
            if (string.IsNullOrWhiteSpace(gender)) return null;

            return gender switch
            {
                "Male" => Gender.Male,
                "Female" => Gender.Female,
                "NonBinary" => Gender.NonBinary,
                "Other" => Gender.Other,
                _ => null
            };
        }

        private static PassengerType ParsePassengerType(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return PassengerType.Adult;

            return value switch
            {
                "Adult" => PassengerType.Adult,
                "Child" => PassengerType.Child,
                "Infant" => PassengerType.Infant,
                _ => PassengerType.Adult
            };
        }

        private static string? NormalizePhone(string? passengerType, string? phone)
        {
            if (passengerType == "Child" || passengerType == "Infant")
                return null;

            return string.IsNullOrWhiteSpace(phone) ? null : phone.Trim();
        }

        private static string? NormalizeEmail(string? passengerType, string? email)
        {
            if (passengerType == "Child" || passengerType == "Infant")
                return null;

            return string.IsNullOrWhiteSpace(email) ? null : email.Trim();
        }
    }
}
