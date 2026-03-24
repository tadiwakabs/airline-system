using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AirlineAPI.Models
{
    [Table("RecurringSchedule")]
    public class RecurringSchedule
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Required]
        [StringLength(3)]
        [Column("departingPort")]
        public string DepartingPort { get; set; } = string.Empty;

        [Required]
        [StringLength(3)]
        [Column("arrivingPort")]
        public string ArrivingPort { get; set; } = string.Empty;

        [Required]
        [Column("departureTimeOfDay", TypeName = "time")]
        public TimeSpan DepartureTimeOfDay { get; set; }

        [Required]
        [Column("arrivalTimeOfDay", TypeName = "time")]
        public TimeSpan ArrivalTimeOfDay { get; set; }

        [Required]
        [StringLength(10)]
        [Column("aircraftUsed")]
        public string AircraftUsed { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        [Column("status")]
        public string Status { get; set; } = string.Empty;

        [Required]
        [Column("isDomestic")]
        public bool IsDomestic { get; set; }

        [Required]
        [Column("distance")]
        public int Distance { get; set; }

        [Column("flightChange")]
        public bool? FlightChange { get; set; }

        [Required]
        [Column("startDate", TypeName = "date")]
        public DateTime StartDate { get; set; }

        [Required]
        [Column("endDate", TypeName = "date")]
        public DateTime EndDate { get; set; }

        [Required]
        [Column("daysOfWeek")]
        public string DaysOfWeek { get; set; } = string.Empty;

        [Column("createdAt")]
        public DateTime CreatedAt { get; set; }

        [Column("updatedAt")]
        public DateTime UpdatedAt { get; set; }

        // Optional navigation props
        [ForeignKey(nameof(DepartingPort))]
        public Airport? DepartingAirport { get; set; }

        [ForeignKey(nameof(ArrivingPort))]
        public Airport? ArrivingAirport { get; set; }

        [ForeignKey(nameof(AircraftUsed))]
        public Aircraft? Aircraft { get; set; }
    }
}
