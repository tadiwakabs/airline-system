using AirlineAPI.Data;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

namespace AirlineAPI.Controllers
{
    [ApiController]
    [Route("api/payment")]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Payment>>> GetAllPayments()
        {
            var payments = await _context.Payments.ToListAsync();
            return Ok(payments);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Payment>> GetPaymentById(int id)
        {
            var payment = await _context.Payments.FindAsync(id);

            if (payment == null)
                return NotFound(new { message = "Payment not found" });

            return Ok(payment);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePayment([FromBody] Payment newPayment)
        {
            if (newPayment == null)
                return BadRequest("Payment data is missing");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var bookingExists = await _context.Bookings
                .AnyAsync(b => b.bookingId == newPayment.bookingId);

            if (!bookingExists)
                return BadRequest(new { message = "Invalid bookingId" });

            newPayment.paymentStatus = PaymentStatus.Success;

            _context.Payments.Add(newPayment);
            await _context.SaveChangesAsync();

            return Ok(newPayment);
        }
        
        [HttpPut("{id}/complete")]
        public async Task<IActionResult> CompletePayment(int id, [FromBody] CompletePaymentRequest dto)
        {
            var payment = await _context.Payments.FindAsync(id);

            if (payment == null)
                return NotFound(new { message = "Payment not found" });

            payment.paymentMethod = dto.PaymentMethod;
            payment.paymentStatus = PaymentStatus.Success;

            var ticket = await _context.Ticket
                .FirstOrDefaultAsync(t => t.bookingId == payment.bookingId);

            if (ticket != null)
                ticket.status = TicketStatus.Booked;

            var booking = await _context.Bookings
                .FirstOrDefaultAsync(b => b.bookingId == payment.bookingId);

            if (booking != null)
                booking.bookingStatus = BookingStatus.Confirmed;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Payment completed successfully.",
                bookingId = payment.bookingId,
                transactionId = payment.transactionId
            });
        }
    }

    public class CompletePaymentRequest
    {
        public string PaymentMethod { get; set; } = "";
    }
}