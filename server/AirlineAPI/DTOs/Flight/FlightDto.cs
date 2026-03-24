using System.ComponentModel.DataAnnotations;

namespace AirlineAPI.DTOs.Flights
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

    public class CreateRecurringFlightDto
    {
        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [Required]
        public TimeSpan DepartureTimeOfDay { get; set; }

        [Required]
        public TimeSpan ArrivalTimeOfDay { get; set; }

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

        [Required]
        public List<DayOfWeek> DaysOfWeek { get; set; } = new();
    }
}
