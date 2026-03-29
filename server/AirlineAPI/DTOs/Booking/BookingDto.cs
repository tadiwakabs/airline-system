namespace AirlineAPI.DTOs.Booking

{
    public class CreateBookingRequest
    {
        public string UserId     { get; set; } = string.Empty;
        public decimal TotalPrice { get; set; }
        public string CabinClass  { get; set; } = "economy";
        public string PaymentMethod { get; set; } = string.Empty;
        public List<TicketRequest> Tickets { get; set; } = new();
    }

    public class TicketRequest
    {
        public int    FlightNum   { get; set; }
        public string PassengerId { get; set; } = string.Empty;
        public string SeatNumber  { get; set; } = string.Empty;
        public decimal Price      { get; set; }
        // Populated from flight data
        public string Origin      { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public string BoardingTime { get; set; } = string.Empty;
    }

    // Returned to the frontend after successful booking
    public class BookingConfirmationDto
    {
        public string   BookingId     { get; set; } = string.Empty;
        public int      TransactionId { get; set; }
        public List<TicketConfirmationDto> Tickets { get; set; } = new();
    }

    public class TicketConfirmationDto
    {
        public string TicketCode  { get; set; } = string.Empty;
        public int    FlightNum   { get; set; }
        public string Origin      { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public string SeatNumber  { get; set; } = string.Empty;
        public string BoardingTime { get; set; } = string.Empty;
        public decimal Price      { get; set; }
        public string PassengerId { get; set; } = string.Empty;
    }
}
