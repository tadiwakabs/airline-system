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
}
