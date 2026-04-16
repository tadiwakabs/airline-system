namespace AirlineAPI.DTOs.Booking
{
    public class FlightStatusDto
    {
        public int       FlightNum     { get; set; }
        public string    Status        { get; set; } = string.Empty;
        public string    DepartingPort { get; set; } = string.Empty;
        public string    ArrivingPort  { get; set; } = string.Empty;
        public DateTime  DepartTime    { get; set; }
        public DateTime  ArrivalTime   { get; set; }
        public string? AircraftUsed { get; set; }
        public string? DepartingCity { get; set; }
        public string? ArrivingCity  { get; set; }

        /// <summary>Null when looked up by flight number directly.</summary>
        public string?   BookingId     { get; set; }
    }
}
