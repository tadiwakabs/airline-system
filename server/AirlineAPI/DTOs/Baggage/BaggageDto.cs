namespace AirlineAPI.DTOs.Baggage
{
    public class CreateBaggageDto
    {
        public string PassengerId { get; set; } = string.Empty;
        public bool AdditionalBaggage { get; set; }
        public double? AdditionalFare { get; set; }
        public bool IsChecked { get; set; }
    }

    public class AttachBaggageTicketDto
    {
        public string BaggageId { get; set; } = string.Empty;
        public string TicketCode { get; set; } = string.Empty;
    }

    public class FlightPassengerBaggageDto
    {
        public string PassengerId { get; set; } = string.Empty;
        public string TicketCode { get; set; } = string.Empty;
        public string SeatNumber { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string TicketClass { get; set; } = string.Empty;
        public int TotalBags { get; set; }
        public int CheckedBags { get; set; }
        public int UncheckedBags { get; set; }
        public bool AllChecked { get; set; }
    }

    public class CheckPassengerBagsDto
    {
        public string PassengerId { get; set; } = string.Empty;
    }
}
