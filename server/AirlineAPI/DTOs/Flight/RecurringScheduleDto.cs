using System.ComponentModel.DataAnnotations;

namespace AirlineAPI.DTOs.Flight
{
    public class RecurringScheduleUpsertDto
    {
        [Required]
        [StringLength(3)]
        public string DepartingPortCode { get; set; } = string.Empty;

        [Required]
        [StringLength(3)]
        public string ArrivingPortCode { get; set; } = string.Empty;

        [Required]
        public TimeSpan DepartureTimeOfDay { get; set; }

        [Required]
        public TimeSpan ArrivalTimeOfDay { get; set; }

        [Required]
        [StringLength(10)]
        public string AircraftUsed { get; set; } = string.Empty;

        [Required]
        public string Status { get; set; } = string.Empty;

        [Required]
        public bool IsDomestic { get; set; }

        [Required]
        public int Distance { get; set; }

        public bool? FlightChange { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        public List<int> DaysOfWeek { get; set; } = new();

        // Optional — applied to every generated flight's FlightPricing rows
        public decimal? EconomyPrice { get; set; }
        public decimal? BusinessPrice { get; set; }
        public decimal? FirstPrice { get; set; }

        // Return-trip options
        public bool IsReturn { get; set; } = false;
        
        public int? LayoverHours { get; set; }
    }
    
    public class RecurringScheduleResponseDto
    {
        public int Id { get; set; }
        public string DepartingPort { get; set; } = string.Empty;
        public string ArrivingPort { get; set; } = string.Empty;
        public string DepartureTimeOfDay { get; set; } = string.Empty;
        public string ArrivalTimeOfDay { get; set; } = string.Empty;
        public string AircraftUsed { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool IsDomestic { get; set; }
        public int Distance { get; set; }
        public bool? FlightChange { get; set; }
        public string StartDate { get; set; } = string.Empty;
        public string EndDate { get; set; } = string.Empty;
        public string DaysOfWeek { get; set; } = string.Empty;
    }
}