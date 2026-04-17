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
            var lastEmployee = await _context.Employees
                .OrderByDescending(e => e.employeeId)
                .Select(e => e.employeeId)
                .FirstOrDefaultAsync();

            int nextNumber = 1;

            if (lastEmployee != null)
            {
                var numPart = int.Parse(lastEmployee.Substring(3));
                nextNumber = numPart + 1;
            }

            var newId = $"EMP{nextNumber:D4}";

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
            
            if (employee.IsAdmin && parsedStatus == WorkStatus.Terminated)
                return BadRequest(new { message = "Admins cannot be terminated." });

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
        
        [HttpGet("cabin-crew")]
        public async Task<IActionResult> GetCabinCrewEmployees()
        {
            var requesterId = GetCurrentUserId();
            if (string.IsNullOrEmpty(requesterId))
                return Unauthorized(new { message = "Invalid token." });

            if (!await CanManageCrewAssignmentsAsync())
                return Forbid();

            var crew = await _context.Employees
                .Include(e => e.Users)
                .Where(e =>
                    e.department == EmployeeDepartment.CabinCrew &&
                    e.status == WorkStatus.Active)
                .OrderBy(e => e.Users!.LastName)
                .ThenBy(e => e.Users!.FirstName)
                .Select(e => new EmployeeDto
                {
                    EmployeeId = e.employeeId,
                    UserId = e.userId,
                    FirstName = e.Users != null ? e.Users.FirstName : null,
                    LastName = e.Users != null ? e.Users.LastName : null,
                    WorkEmail = e.workEmail,
                    WorkPhone = e.workPhone,
                    JobTitle = e.jobTitle,
                    Department = FormatDepartment(e.department),
                    HireDate = e.hire_date,
                    WorkLocation = e.workLocation,
                    Status = e.status.ToString(),
                    IsAdmin = e.IsAdmin
                })
                .ToListAsync();

            return Ok(crew);
        }
        
        [HttpGet("flight/{flightNum}/crew")]
        public async Task<IActionResult> GetCrewForFlight(int flightNum)
        {
            var requesterId = GetCurrentUserId();
            if (string.IsNullOrEmpty(requesterId))
                return Unauthorized(new { message = "Invalid token." });

            if (!await CanManageCrewAssignmentsAsync())
                return Forbid();

            var flightExists = await _context.Flights.AnyAsync(f => f.flightNum == flightNum);
            if (!flightExists)
                return NotFound(new { message = "Flight not found." });

            var crew = await _context.FlightCrewAssignments
                .Where(a => a.flightNum == flightNum)
                .Include(a => a.Employee)
                .ThenInclude(e => e!.Users)
                .OrderBy(a => a.Employee!.Users!.LastName)
                .ThenBy(a => a.Employee!.Users!.FirstName)
                .Select(a => new CrewAssignmentDto
                {
                    FlightNum = a.flightNum,
                    EmployeeId = a.employeeId,
                    FirstName = a.Employee != null && a.Employee.Users != null ? a.Employee.Users.FirstName : null,
                    LastName = a.Employee != null && a.Employee.Users != null ? a.Employee.Users.LastName : null,
                    Department = a.Employee != null ? FormatDepartment(a.Employee.department) : null,
                    JobTitle = a.Employee != null ? a.Employee.jobTitle : null,
                    AssignedAt = a.assignedAt
                })
                .ToListAsync();

            return Ok(crew);
        }
        
        [HttpPost("flight/crew-counts")]
        public async Task<IActionResult> GetCrewCountsForFlights([FromBody] CrewCountsRequestDto request)
        {
            var requesterId = GetCurrentUserId();
            if (string.IsNullOrEmpty(requesterId))
                return Unauthorized(new { message = "Invalid token." });

            if (!await CanManageCrewAssignmentsAsync())
                return Forbid();

            if (request.FlightNums == null || request.FlightNums.Count == 0)
                return Ok(new List<CrewCountDto>());

            var distinctFlightNums = request.FlightNums.Distinct().ToList();

            var counts = await _context.FlightCrewAssignments
                .Where(a => distinctFlightNums.Contains(a.flightNum))
                .GroupBy(a => a.flightNum)
                .Select(g => new CrewCountDto
                {
                    FlightNum = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            return Ok(counts);
        }
        
        [HttpPost("flight/assign-crew")]
        public async Task<IActionResult> AssignCrewToFlight([FromBody] AssignCrewDto request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var requesterId = GetCurrentUserId();
            if (string.IsNullOrEmpty(requesterId))
                return Unauthorized(new { message = "Invalid token." });

            if (!await CanManageCrewAssignmentsAsync())
                return Forbid();

            var flight = await _context.Flights.FirstOrDefaultAsync(f => f.flightNum == request.FlightNum);
            if (flight == null)
                return NotFound(new { message = "Flight not found." });

            var employee = await _context.Employees
                .Include(e => e.Users)
                .FirstOrDefaultAsync(e => e.employeeId == request.EmployeeId);

            if (employee == null)
                return NotFound(new { message = "Employee not found." });

            if (employee.status != WorkStatus.Active)
                return BadRequest(new { message = "Only active employees can be assigned to flights." });

            if (employee.department != EmployeeDepartment.CabinCrew)
                return BadRequest(new { message = "Only Cabin Crew employees can be assigned to flights." });

            var existing = await _context.FlightCrewAssignments
                .AnyAsync(a => a.flightNum == request.FlightNum && a.employeeId == request.EmployeeId);

            if (existing)
                return BadRequest(new { message = "This crew member is already assigned to the flight." });

            var assignment = new FlightCrewAssignment
            {
                flightNum = request.FlightNum,
                employeeId = request.EmployeeId,
                assignedAt = DateTime.UtcNow
            };

            _context.FlightCrewAssignments.Add(assignment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Crew member assigned successfully." });
        }
        
        [HttpDelete("flight/{flightNum}/crew/{employeeId}")]
        public async Task<IActionResult> RemoveCrewFromFlight(int flightNum, string employeeId)
        {
            var requesterId = GetCurrentUserId();
            if (string.IsNullOrEmpty(requesterId))
                return Unauthorized(new { message = "Invalid token." });

            if (!await CanManageCrewAssignmentsAsync())
                return Forbid();

            var assignment = await _context.FlightCrewAssignments
                .FirstOrDefaultAsync(a => a.flightNum == flightNum && a.employeeId == employeeId);

            if (assignment == null)
                return NotFound(new { message = "Crew assignment not found." });

            _context.FlightCrewAssignments.Remove(assignment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Crew member removed from flight." });
        }
        
        [HttpGet("my-upcoming-flights")]
        public async Task<IActionResult> GetMyUpcomingFlights()
        {
            var employee = await GetCurrentEmployeeAsync();

            if (employee == null)
                return Unauthorized(new { message = "Invalid token." });

            if (!IsCabinCrew(employee) && !employee.IsAdmin)
                return Forbid();

            var now = DateTime.UtcNow;

            var flights = await _context.FlightCrewAssignments
                .Where(a => a.employeeId == employee.employeeId)
                .Include(a => a.Flight)
                .Where(a => a.Flight != null && a.Flight.departTime >= now)
                .OrderBy(a => a.Flight!.departTime)
                .Select(a => new CrewUpcomingFlightDto
                {
                    FlightNum = a.Flight!.flightNum,
                    DepartTime = a.Flight.departTime,
                    ArrivalTime = a.Flight.arrivalTime,
                    AircraftUsed = a.Flight.aircraftUsed,
                    Status = a.Flight.status,
                    DepartingPort = a.Flight.departingPort,
                    ArrivingPort = a.Flight.arrivingPort
                })
                .ToListAsync();

            return Ok(flights);
        }
        
        [HttpGet("my-flights/{flightNum}/passengers")]
        public async Task<IActionResult> GetPassengersForMyFlight(int flightNum)
        {
            var employee = await GetCurrentEmployeeAsync();

            if (employee == null)
                return Unauthorized(new { message = "Invalid token." });

            if (!IsCabinCrew(employee) && !employee.IsAdmin)
                return Forbid();

            var isAssigned = await _context.FlightCrewAssignments
                .AnyAsync(a => a.flightNum == flightNum && a.employeeId == employee.employeeId);

            if (!isAssigned && !employee.IsAdmin)
                return Forbid();

            var passengers = await _context.Ticket
                .Include(t => t.Passenger)
                .Where(t =>
                    t.flightCode == flightNum &&
                    (t.status == TicketStatus.Booked || t.status == TicketStatus.Boarded)
                )
                .OrderBy(t => t.seatNumber)
                .Select(t => new CrewFlightPassengerDto
                {
                    TicketCode = t.ticketCode,
                    PassengerId = t.passengerId,
                    FirstName = t.Passenger != null ? t.Passenger.FirstName : null,
                    LastName = t.Passenger != null ? t.Passenger.LastName : null,
                    SeatNumber = t.seatNumber,
                    TicketClass = t.ticketClass != null ? t.ticketClass.ToString() : null,
                    TicketStatus = t.status != null ? t.status.ToString() : null
                })
                .ToListAsync();

            return Ok(passengers);
        }
        
        [HttpPut("my-flights/{flightNum}/board/{ticketCode}")]
        public async Task<IActionResult> MarkPassengerBoarded(int flightNum, string ticketCode)
        {
            var employee = await GetCurrentEmployeeAsync();

            if (employee == null)
                return Unauthorized(new { message = "Invalid token." });

            if (!IsCabinCrew(employee) && !employee.IsAdmin)
                return Forbid();

            var isAssigned = await _context.FlightCrewAssignments
                .AnyAsync(a => a.flightNum == flightNum && a.employeeId == employee.employeeId);

            if (!isAssigned && !employee.IsAdmin)
                return Forbid();

            var ticket = await _context.Ticket
                .FirstOrDefaultAsync(t => t.ticketCode == ticketCode && t.flightCode == flightNum);

            if (ticket == null)
                return NotFound(new { message = "Ticket not found." });

            if (ticket.status == TicketStatus.Boarded)
                return BadRequest(new { message = "Passenger already boarded." });

            ticket.status = TicketStatus.Boarded;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Passenger marked as boarded." });
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
        
        private async Task<Employee?> GetCurrentEmployeeAsync()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return null;

            return await _context.Employees
                .Include(e => e.Users)
                .FirstOrDefaultAsync(e => e.userId == userId);
        }
        
        private async Task<bool> CanManageCrewAssignmentsAsync()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return false;

            if (await IsAdminAsync(userId))
                return true;

            var employee = await GetCurrentEmployeeAsync();
            return employee != null && IsFlightOps(employee);
        }

        private static bool IsCabinCrew(Employee employee) =>
            employee.department == EmployeeDepartment.CabinCrew &&
            employee.status == WorkStatus.Active;

        private static bool IsFlightOps(Employee employee) =>
            employee.department == EmployeeDepartment.FlightOps &&
            employee.status == WorkStatus.Active;
    }
}
