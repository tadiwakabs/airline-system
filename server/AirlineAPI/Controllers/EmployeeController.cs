using System.Security.Claims;
using AirlineAPI.Data;
using AirlineAPI.DTOs.Employee;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class EmployeeController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmployeeController(AppDbContext context)
        {
            _context = context;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirst("sub")?.Value
                   ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        private async Task<bool> IsAdminAsync(string userId)
        {
            var emp = await _context.Employees
                .FirstOrDefaultAsync(e => e.userId == userId && e.IsAdmin);
            return emp != null;
        }

        // ── GET /api/employee ─────────────────────────────────────────────────

        [HttpGet]
        public async Task<IActionResult> GetAllEmployees()
        {
            var requesterId = GetCurrentUserId();
            if (string.IsNullOrEmpty(requesterId))
                return Unauthorized(new { message = "Invalid token." });

            if (!await IsAdminAsync(requesterId))
                return Forbid();

            var employees = await _context.Employees
                .Include(e => e.Users)
                .ToListAsync();
            var result = employees.Select(e => new EmployeeDto
            {
                EmployeeId   = e.employeeId,
                UserId       = e.userId,
                FirstName    = e.Users?.FirstName,
                LastName     = e.Users?.LastName,
                WorkEmail    = e.workEmail,
                WorkPhone    = e.workPhone,
                JobTitle     = e.jobTitle,
                Department   = FormatDepartment(e.department),
                HireDate     = e.hire_date,
                WorkLocation = e.workLocation,
                Status       = e.status.ToString(),
                IsAdmin      = e.IsAdmin,
            }).ToList();

            return Ok(result);

            return Ok(employees);
        }

        // ── GET /api/employee/{employeeId} ────────────────────────────────────

        [HttpGet("{employeeId}")]
        public async Task<IActionResult> GetEmployee(string employeeId)
        {
            var requesterId = GetCurrentUserId();
            if (string.IsNullOrEmpty(requesterId))
                return Unauthorized(new { message = "Invalid token." });

            if (!await IsAdminAsync(requesterId))
                return Forbid();

            var e = await _context.Employees
                .Include(e => e.Users)
                .FirstOrDefaultAsync(e => e.employeeId == employeeId);

            if (e == null)
                return NotFound(new { message = "Employee not found." });

            return Ok(new EmployeeDto
            {
                EmployeeId   = e.employeeId,
                UserId       = e.userId,
                FirstName    = e.Users?.FirstName,
                LastName     = e.Users?.LastName,
                WorkEmail    = e.workEmail,
                WorkPhone    = e.workPhone,
                JobTitle     = e.jobTitle,
                Department   = FormatDepartment(e.department),
                HireDate     = e.hire_date,
                WorkLocation = e.workLocation,
                Status       = e.status.ToString(),
                IsAdmin      = e.IsAdmin,
            });
        }

        // ── POST /api/employee ────────────────────────────────────────────────

        [HttpPost]
        public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var requesterId = GetCurrentUserId();
            if (string.IsNullOrEmpty(requesterId))
                return Unauthorized(new { message = "Invalid token." });

            if (!await IsAdminAsync(requesterId))
                return Forbid();

            // Validate the target user exists
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == request.UserId);
            if (user == null)
                return NotFound(new { message = "User not found." });

            // Prevent duplicate employee records for the same user
            var existing = await _context.Employees.AnyAsync(e => e.userId == request.UserId);
            if (existing)
                return BadRequest(new { message = "An employee record already exists for this user." });

            // Generate a new employee ID
            var count    = await _context.Employees.CountAsync();
            var newId    = $"EMP{(count + 1):D4}";

            var parsedStatus = ParseStatus(request.Status);
            if (parsedStatus == null)
                return BadRequest(new { message = "Invalid status value." });
            
            var parsedDepartment = ParseDepartment(request.Department);
            if (parsedDepartment == null)
                return BadRequest(new { message = "Invalid department value." });

            var employee = new Employee
            {
                employeeId   = newId,
                userId       = request.UserId,
                workEmail    = request.WorkEmail,
                workPhone    = request.WorkPhone,
                jobTitle     = request.JobTitle,
                department   = parsedDepartment.Value,
                hire_date    = request.HireDate ?? DateTime.UtcNow,
                workLocation = request.WorkLocation.ToUpper(),
                status       = parsedStatus.Value,
                IsAdmin      = request.IsAdmin,
            };

            _context.Employees.Add(employee);

            // Update user role to Employee
            user.UserRole  = UserRole.Employee;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEmployee), new { employeeId = newId }, new
            {
                message    = "Employee created successfully.",
                employeeId = newId,
            });
        }

        // ── PUT /api/employee/{employeeId} ────────────────────────────────────

        [HttpPut("{employeeId}")]
        public async Task<IActionResult> UpdateEmployee(string employeeId, [FromBody] UpdateEmployeeDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var requesterId = GetCurrentUserId();
            if (string.IsNullOrEmpty(requesterId))
                return Unauthorized(new { message = "Invalid token." });

            if (!await IsAdminAsync(requesterId))
                return Forbid();

            var employee = await _context.Employees
                .Include(e => e.Users)
                .FirstOrDefaultAsync(e => e.employeeId == employeeId);

            if (employee == null)
                return NotFound(new { message = "Employee not found." });

            var parsedStatus = ParseStatus(request.Status);
            if (parsedStatus == null)
                return BadRequest(new { message = "Invalid status value." });
            
            var parsedDepartment = ParseDepartment(request.Department);
            if (parsedDepartment == null)
                return BadRequest(new { message = "Invalid department value." });

            var previousStatus = employee.status;

            employee.workEmail    = request.WorkEmail;
            employee.workPhone    = request.WorkPhone;
            employee.jobTitle     = request.JobTitle;
            employee.department   = parsedDepartment.Value;
            employee.hire_date    = request.HireDate ?? employee.hire_date;
            employee.workLocation = request.WorkLocation.ToUpper();
            employee.status       = parsedStatus.Value;
            employee.IsAdmin      = request.IsAdmin;

            // Sync user role based on status change
            if (employee.Users != null)
            {
                if (previousStatus != WorkStatus.Terminated && parsedStatus == WorkStatus.Terminated)
                {
                    employee.Users.UserRole  = UserRole.Passenger;
                    employee.Users.UpdatedAt = DateTime.UtcNow;
                }
                else if (previousStatus == WorkStatus.Terminated && parsedStatus != WorkStatus.Terminated)
                {
                    employee.Users.UserRole  = UserRole.Employee;
                    employee.Users.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Employee updated successfully." });
        }

        // ── DELETE /api/employee/{employeeId} ─────────────────────────────────

        [HttpDelete("{employeeId}")]
        public async Task<IActionResult> DeleteEmployee(string employeeId)
        {
            var requesterId = GetCurrentUserId();
            if (string.IsNullOrEmpty(requesterId))
                return Unauthorized(new { message = "Invalid token." });

            if (!await IsAdminAsync(requesterId))
                return Forbid();

            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.employeeId == employeeId);
            if (employee == null)
                return NotFound(new { message = "Employee not found." });

            _context.Employees.Remove(employee);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Employee deleted successfully." });
        }

        // ── GET /api/user/lookup?q= ───────────────────────────────────────────
        // (Add this action to UserController.cs instead if you prefer)

        [HttpGet("/api/user/lookup")]
        public async Task<IActionResult> LookupUser([FromQuery] string q)
        {
            var requesterId = GetCurrentUserId();
            if (string.IsNullOrEmpty(requesterId))
                return Unauthorized(new { message = "Invalid token." });

            if (!await IsAdminAsync(requesterId))
                return Forbid();

            if (string.IsNullOrWhiteSpace(q))
                return BadRequest(new { message = "Query parameter 'q' is required." });

            var user = await _context.Users.FirstOrDefaultAsync(u =>
                u.UserId == q || u.Email == q);

            if (user == null)
                return NotFound(new { message = "No user found with that ID or email." });

            return Ok(new
            {
                userId    = user.UserId,
                firstName = user.FirstName,
                lastName  = user.LastName,
                email     = user.Email,
                userRole  = user.UserRole.ToString(),
            });
        }

        // ── Helpers ───────────────────────────────────────────────────────────

        private static WorkStatus? ParseStatus(string? status) =>
            status switch
            {
                "Active"     => WorkStatus.Active,
                "OnLeave"    => WorkStatus.OnLeave,
                "Terminated" => WorkStatus.Terminated,
                _            => null,
            };
        
        private static EmployeeDepartment? ParseDepartment(string? department) =>
            department switch
            {
                "Cabin Crew" => EmployeeDepartment.CabinCrew,
                "Flight Ops" => EmployeeDepartment.FlightOps,
                "Administrative" => EmployeeDepartment.Administrative,
                _ => null,
            };
        
        private static string FormatDepartment(EmployeeDepartment department) =>
            department switch
            {
                EmployeeDepartment.CabinCrew => "Cabin Crew",
                EmployeeDepartment.FlightOps => "Flight Ops",
                EmployeeDepartment.Administrative => "Administrative",
                _ => department.ToString()
            };
    }
}
