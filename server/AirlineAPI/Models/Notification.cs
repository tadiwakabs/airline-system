namespace AirlineAPI.Models
{
    public class Notification
    {
        public int notificationId { get; set; }
        public string userId { get; set; } = string.Empty;
        public string? bookingId { get; set; }
        public int? flightNum { get; set; }
        public string message { get; set; } = string.Empty;
        public DateTime createdAt { get; set; }
        public string notificationStatus { get; set; } = "Unread";
    }
}