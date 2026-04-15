using System.ComponentModel.DataAnnotations;

namespace AirlineAPI.DTOs.Employee
{
    public class AssignCrewDto
    {
        [Required]
        public int FlightNum { get; set; }

        [Required]
        [StringLength(50)]
        public string EmployeeId { get; set; } = string.Empty;
    }

    public class CrewAssignmentDto
    {
        public int FlightNum { get; set; }
        public string EmployeeId { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Department { get; set; }
        public string? JobTitle { get; set; }
        public DateTime? AssignedAt { get; set; }
    }

    public class CrewUpcomingFlightDto
    {
        public int FlightNum { get; set; }
        public DateTime DepartTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public string AircraftUsed { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string DepartingPort { get; set; } = string.Empty;
        public string ArrivingPort { get; set; } = string.Empty;
    }

    public class CrewFlightPassengerDto
    {
        public string TicketCode { get; set; }
        public string PassengerId { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string SeatNumber { get; set; } = string.Empty;
        public string? TicketClass { get; set; }
        public string? TicketStatus { get; set; }
    }
}
