using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema; 
using System.Text.Json.Serialization;

namespace AirlineAPI.Models
{
    [Table("Aircraft")]
    public class Aircraft
    {
        [Key]
        [Required]
        [StringLength(10)]
        public string tailnumber{get;set;}=string.Empty;

        [StringLength(30)]
        public string? planeType{get;set;}

        [Required]
        [Range(200,300)]
        public int numSeats{get;set;}

        [StringLength(50)]
        public string? manufacturerName{get;set;}

        [Required]
        [Range(9000,11000)]
        public int flightRange{get;set;}

        [Required]
        [StringLength(3)]
        [JsonPropertyName("currentAirportCode")]
        public string currentAirport{get;set;}= string.Empty;

        [JsonPropertyName("currentFlightId")]
        public int? currentFlight{get;set;} //to do: set unique

        //------links-------//
        [ForeignKey("currentAirport")]
        [JsonPropertyName("currentAirportDetails")]
        public Airport? CurrentAirport{get;set;}

        [ForeignKey("currentFlight")]
        [JsonPropertyName("currentFlightDetails")]
        public Flight? CurrentFlight{get;set;}

    }

}
