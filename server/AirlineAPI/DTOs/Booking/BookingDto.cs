namespace AirlineAPI.DTOs.Booking

{
    public class CreateBookingRequest
    {
        public string UserId { get; set; } = string.Empty;
        public decimal TotalPrice { get; set; }
    }
}
