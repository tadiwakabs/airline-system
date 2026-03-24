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
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirst("sub")?.Value
                   ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = GetCurrentUserId();

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Invalid token." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                return NotFound(new { message = "User not found." });

            var profile = new ProfileDto
            {
                UserId = user.UserId,
                Username = user.Username,
                Email = user.Email,
                Title = user.Title?.ToString(),
                FirstName = user.FirstName,
                LastName = user.LastName,
                DateOfBirth = user.DateOfBirth,
                Gender = user.Gender?.ToString(),
                UserRole = user.UserRole.ToString(),
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt
            };

            return Ok(profile);
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile([FromBody] UpdateProfileDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Invalid token." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                return NotFound(new { message = "User not found." });

            var emailExists = await _context.Users
                .AnyAsync(u => u.Email == request.Email && u.UserId != userId);

            if (emailExists)
                return BadRequest(new { message = "Email is already in use." });

            user.Email = request.Email;
            user.Title = ParseTitle(request.Title);
            user.Gender = ParseGender(request.Gender);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully." });
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "Invalid token." });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                return NotFound(new { message = "User not found." });

            var passwordValid = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash);

            if (!passwordValid)
                return BadRequest(new { message = "Current password is incorrect." });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully." });
        }

        private static UserTitle? ParseTitle(string? title)
        {
            if (string.IsNullOrWhiteSpace(title))
                return null;

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
            if (string.IsNullOrWhiteSpace(gender))
                return null;

            return gender switch
            {
                "Male" => Gender.Male,
                "Female" => Gender.Female,
                "NonBinary" => Gender.NonBinary,
                "Other" => Gender.Other,
                _ => null
            };
        }
    }
}
