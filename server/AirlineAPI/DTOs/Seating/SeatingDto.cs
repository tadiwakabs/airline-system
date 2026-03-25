namespace AirlineAPI.DTOs.Seating
{
    public class SeatReserveRequest
    {
        public int FlightNum { get; set; }
        public string SeatNumber { get; set; } = string.Empty;
        public string PassengerId { get; set; } = string.Empty;
        public string CabinClass { get; set; } = string.Empty;
    }

    public class SeatReleaseRequest
    {
        public int FlightNum { get; set; }
        public string SeatNumber { get; set; } = string.Empty;
        public string PassengerId { get; set; } = string.Empty;
    }

    public class SeatFinalizeRequest
    {
        public int FlightNum { get; set; }
        public string SeatNumber { get; set; } = string.Empty;
        public string PassengerId { get; set; } = string.Empty;
        public string? TicketCode { get; set; }
    }
}
