using AirlineAPI.Data;
using AirlineAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

        // GET: api/payment
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Payment>>> GetAllPayments()
        {
            var payments = await _context.Payments.ToListAsync();
            return Ok(payments);
        }

        // GET: api/payment/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Payment>> GetPaymentById(int id)
        {
            var payment = await _context.Payments.FindAsync(id);

            if (payment == null)
                return NotFound(new { message = "Payment not found" });

            return Ok(payment);
        }

        // POST: api/payment
        [HttpPost]
        public async Task<IActionResult> CreatePayment([FromBody] Payment newPayment)
        {
            if (newPayment == null)
                return BadRequest("Payment data is missing");

            // Validate booking exists
            var bookingExists = await _context.Bookings
                .AnyAsync(b => b.bookingId == newPayment.bookingId);

            if (!bookingExists)
                return BadRequest("Invalid bookingId");

            newPayment.paymentStatus = PaymentStatus.Sucess;

            _context.Payments.Add(newPayment);
            await _context.SaveChangesAsync();

            return Ok(newPayment);
        }
    }
}