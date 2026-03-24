using AirlineAPI.Models;

namespace AirlineAPI.DTOs.Flight
{
    public class CreateRecurringFlightDto
    {
        public string DepartTime { get; set; } = null!;
        public string ArrivalTime { get; set; } = null!;
        public string AircraftUsed { get; set; } = null!;
        public string Status { get; set; } = null!;
        public string DepartingPortCode { get; set; } = null!;
        public string ArrivingPortCode { get; set; } = null!;
        public bool IsDomestic { get; set; }
        public int Distance { get; set; }
        public bool FlightChange { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public List<DayOfWeek> DaysOfWeek { get; set; } = new();
    }
}
