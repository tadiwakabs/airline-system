using System.ComponentModel.DataAnnotations.Schema;

namespace AirlineAPI.Models
{
    [Table("FlightCrewAssignment")]
    public class FlightCrewAssignment
    {
        public int flightNum { get; set; }

        [ForeignKey(nameof(flightNum))]
        public Flight? Flight { get; set; }

        public string employeeId { get; set; } = string.Empty;

        [ForeignKey(nameof(employeeId))]
        public Employee? Employee { get; set; }

        public DateTime? assignedAt { get; set; }
    }
}
