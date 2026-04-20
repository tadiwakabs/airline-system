using AirlineAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace AirlineAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("me")]
        public async Task<ActionResult> GetMyNotifications()
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized("User not authenticated.");

            var notifications = await _context.Notification
                .Where(n => n.userId == currentUserId)
                .OrderByDescending(n => n.createdAt)
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpPut("{id}/read")]
public async Task<IActionResult> MarkAsRead(int id)
{
    var notification = await _context.Notification.FindAsync(id);

    if (notification == null)
        return NotFound(new { message = "Notification not found." });

    notification.notificationStatus = "Read";

    await _context.SaveChangesAsync();

    return Ok(new { message = "Notification marked as read." });
}
    }
}