using System.ComponentModel.DataAnnotations;

namespace AirlineAPI.DTOs.Flight
{
    public class CreateFlightDto
    {
        [Required]
        [Range(0, 9999)]
        public int FlightNum { get; set; }

        [Required]
        public DateTime DepartTime { get; set; }

        [Required]
        public DateTime ArrivalTime { get; set; }

        [Required]
        public string AircraftUsed { get; set; } = string.Empty;

        [Required]
        public string Status { get; set; } = string.Empty;

        [Required]
        public string DepartingPortCode { get; set; } = string.Empty;

        [Required]
        public string ArrivingPortCode { get; set; } = string.Empty;

        public bool IsDomestic { get; set; }
        public int Distance { get; set; }
        public bool? FlightChange { get; set; }
    }

    public class UpdateFlightDto
    {
        [Required]
        public DateTime DepartTime { get; set; }

        [Required]
        public DateTime ArrivalTime { get; set; }

        [Required]
        public string AircraftUsed { get; set; } = string.Empty;

        [Required]
        public string Status { get; set; } = string.Empty;

        [Required]
        public string DepartingPortCode { get; set; } = string.Empty;

        [Required]
        public string ArrivingPortCode { get; set; } = string.Empty;

        public bool IsDomestic { get; set; }
        public int Distance { get; set; }
        public bool? FlightChange { get; set; }
    }
    
    public class FlightResponseDto
    {
        public int FlightNum { get; set; }
        public DateTime DepartTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public string AircraftUsed { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string DepartingPortCode { get; set; } = string.Empty;
        public string ArrivingPortCode { get; set; } = string.Empty;
        public bool IsDomestic { get; set; }
        public int Distance { get; set; }
        public bool? FlightChange { get; set; }
        public int? RecurringScheduleId { get; set; }
        public List<FlightPricingDto> Pricing { get; set; } = new();
    }
    
    public class FlightSearchResultDto
    {
        public string Type { get; set; } = "";
        public List<FlightLegDto> Flights { get; set; } = new();
        public FlightSearchPricingDto Pricing { get; set; } = new();
    }

    public class FlightLegDto
    {
        public int FlightNum { get; set; }
        public string DepartingPortCode { get; set; } = "";
        public string ArrivingPortCode { get; set; } = "";
        public DateTime DepartTime { get; set; }
        public DateTime ArrivalTime { get; set; }
        public string Status { get; set; } = "";
        public string AircraftUsed { get; set; } = "";
        public int Distance { get; set; }
    }

    public class FlightSearchPricingDto
    {
        public decimal? Economy { get; set; }
        public decimal? Business { get; set; }
        public decimal? First { get; set; }
    }
}
