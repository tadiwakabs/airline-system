using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace AirlineAPI.Models
{
    [Table("Flight")] 
    public class Flight
    {
        [Key]
        [Required]
        [Range(0,9999)]
        public int flightNum { get; set; }

        [Required]
        public DateTime departTime { get; set; }

        [Required]
        public DateTime arrivalTime { get; set; }
        
        [Required]
        [StringLength(10)]
        public string aircraftUsed { get; set; } = string.Empty;
        
        [Required]
        public string status { get; set; } = string.Empty; 

        [Required]
        [StringLength(30)]
        [JsonPropertyName("departingPortCode")]
        public string departingPort { get; set; } = string.Empty;

        [Required]
        [StringLength(30)]
        [JsonPropertyName("arrivingPortCode")]

        public string arrivingPort { get; set; } = string.Empty;

        public bool isDomestic { get; set; }
        public int distance { get; set; }
        public bool? flightChange { get; set; }
        public int? recurringScheduleId { get; set; }

        //----Links----
        [ForeignKey("aircraftUsed")]
        public Aircraft? Aircraft{get;set;}

        [ForeignKey("departingPort")]
        [JsonPropertyName("departingPortData")]
        public Airport? DepartingPort{get;set;}

        [ForeignKey("arrivingPort")]
        [JsonPropertyName("arrivingPortData")]
        public Airport? ArrivingPort{get;set;}
        
        [ForeignKey("recurringScheduleId")]
        public RecurringSchedule? RecurringSchedule { get; set; }
        
        public ICollection<FlightPricing> Pricing { get; set; } = new List<FlightPricing>();
    }
}