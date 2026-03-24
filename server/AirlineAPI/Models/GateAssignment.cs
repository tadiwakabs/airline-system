using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AirlineAPI.Models
{
    public enum GateStatus
    {
        Delayed,
        Unloading,
        Boarding,
        Closed
    }

    [Table("GateAssignment")]
    public class GateAssignment
    {
        [Key]
        [Required]
        public int flightNum { get; set; }

        [ForeignKey("flightNum")]
        public Flight? Flight { get; set; }

        public string? gateDeparture { get; set; }

        public string? gateArrival { get; set; }

        public GateStatus? gateStatus { get; set; }
    }
}