using AirlineAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace AirlineAPI.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Flight> Flights{get; set;}
        public DbSet<Aircraft> Aircraft { get; set;}
        public DbSet<Passenger> Passenger { get; set; }
        public DbSet<RecurringSchedule> RecurringSchedules { get; set; }
        public DbSet<Airport> Airports {get;set;}
        public DbSet<FlightPricing> FlightPricing { get; set; }
        public DbSet<Countries> Countries { get; set; }
        public DbSet<States> States { get; set; }
        public DbSet<Seating> Seating { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Booking> Bookings { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Ticket> Ticket { get; set; }
        public DbSet<Standby> Standby { get; set; }
        public DbSet<Notification> Notification { get; set; }
        public DbSet<Baggage> Baggage { get; set; }
        public DbSet<FlightCrewAssignment> FlightCrewAssignments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");

                entity.HasKey(u => u.UserId);

                entity.HasIndex(u => u.Username).IsUnique();
                entity.HasIndex(u => u.Email).IsUnique();

                entity.Property(u => u.UserId)
                    .HasColumnName("userId")
                    .HasMaxLength(50);

                entity.Property(u => u.Username)
                    .HasColumnName("username")
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(u => u.PasswordHash)
                    .HasColumnName("passwordHash")
                    .HasMaxLength(255)
                    .IsRequired();

                entity.Property(u => u.Email)
                    .HasColumnName("email")
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(u => u.Title)
                    .HasColumnName("title")
                    .HasConversion(
                        v => ConvertTitleToDb(v),
                        v => ConvertTitleFromDb(v)
                    );

                entity.Property(u => u.FirstName)
                    .HasColumnName("firstName")
                    .HasMaxLength(30)
                    .IsRequired();

                entity.Property(u => u.LastName)
                    .HasColumnName("lastName")
                    .HasMaxLength(30)
                    .IsRequired();

                entity.Property(u => u.DateOfBirth)
                    .HasColumnName("dateOfBirth")
                    .HasColumnType("date")
                    .IsRequired();

                entity.Property(u => u.Gender)
                    .HasColumnName("gender")
                    .HasConversion(
                        v => ConvertGenderToDb(v),
                        v => ConvertGenderFromDb(v)
                    );

                entity.Property(u => u.UserRole)
                    .HasColumnName("userRole")
                    .HasConversion<string>()
                    .IsRequired();

                entity.Property(u => u.CreatedAt)
                    .HasColumnName("createdAt");

                entity.Property(u => u.UpdatedAt)
                    .HasColumnName("updatedAt");
            });
            
            modelBuilder.Entity<RecurringSchedule>(entity =>
            {
                entity.ToTable("RecurringSchedule");

                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id)
                    .HasColumnName("id");

                entity.Property(e => e.DepartingPort)
                    .HasColumnName("departingPort");

                entity.Property(e => e.ArrivingPort)
                    .HasColumnName("arrivingPort");

                entity.Property(e => e.DepartureTimeOfDay)
                    .HasColumnName("departureTimeOfDay");

                entity.Property(e => e.ArrivalTimeOfDay)
                    .HasColumnName("arrivalTimeOfDay");

                entity.Property(e => e.AircraftUsed)
                    .HasColumnName("aircraftUsed");

                entity.Property(e => e.Status)
                    .HasColumnName("status");

                entity.Property(e => e.IsDomestic)
                    .HasColumnName("isDomestic");

                entity.Property(e => e.Distance)
                    .HasColumnName("distance");

                entity.Property(e => e.FlightChange)
                    .HasColumnName("flightChange");

                entity.Property(e => e.StartDate)
                    .HasColumnName("startDate");

                entity.Property(e => e.EndDate)
                    .HasColumnName("endDate");

                entity.Property(e => e.DaysOfWeek)
                    .HasColumnName("daysOfWeek");

                entity.Property(e => e.CreatedAt)
                    .HasColumnName("createdAt");

                entity.Property(e => e.UpdatedAt)
                    .HasColumnName("updatedAt");
            });
            
            modelBuilder.Entity<FlightPricing>(entity =>
            {
                entity.ToTable("FlightPricing");
 
                entity.HasKey(e => new { e.FlightNum, e.CabinClass });
 
                entity.Property(e => e.FlightNum)
                    .HasColumnName("flightNum");
 
                entity.Property(e => e.CabinClass)
                    .HasColumnName("cabinClass")
                    .HasConversion(
                        v => v.ToString(),
                        v => (CabinClass)Enum.Parse(typeof(CabinClass), v)
                    );
 
                entity.Property(e => e.Price)
                    .HasColumnName("price")
                    .HasColumnType("decimal(10,2)");
 
                entity.HasOne(e => e.Flight)
                    .WithMany(f => f.Pricing)
                    .HasForeignKey(e => e.FlightNum)
                    .OnDelete(DeleteBehavior.Cascade);
            });
            
            modelBuilder.Entity<Passenger>(entity =>
            {
                entity.ToTable("Passenger");

                entity.HasKey(p => p.PassengerId);

                entity.Property(p => p.PassengerId)
                    .HasColumnName("passengerId")
                    .HasMaxLength(50);

                entity.Property(p => p.UserId)
                    .HasColumnName("userId")
                    .HasMaxLength(50);

                entity.Property(p => p.Title)
                    .HasColumnName("title")
                    .HasConversion(
                        v => ConvertTitleToDb(v),
                        v => ConvertTitleFromDb(v)
                    );

                entity.Property(p => p.FirstName)
                    .HasColumnName("firstName")
                    .HasMaxLength(30)
                    .IsRequired();

                entity.Property(p => p.LastName)
                    .HasColumnName("lastName")
                    .HasMaxLength(30)
                    .IsRequired();

                entity.Property(p => p.DateOfBirth)
                    .HasColumnName("dateOfBirth")
                    .HasColumnType("date")
                    .IsRequired();

                entity.Property(p => p.Gender)
                    .HasColumnName("gender")
                    .HasConversion(
                        v => ConvertGenderToDb(v),
                        v => ConvertGenderFromDb(v)
                    );

                entity.Property(p => p.PhoneNumber)
                    .HasColumnName("phoneNumber")
                    .HasMaxLength(20);

                entity.Property(p => p.Email)
                    .HasColumnName("email")
                    .HasMaxLength(100);

                entity.Property(p => p.DLNumber)
                    .HasColumnName("DLNumber");

                entity.Property(p => p.DLState)
                    .HasColumnName("DLState")
                    .HasMaxLength(2);

                entity.Property(p => p.PassportNumber)
                    .HasColumnName("passportNumber")
                    .HasMaxLength(20);

                entity.Property(p => p.PassportCountryCode)
                    .HasColumnName("passportCountryCode")
                    .HasMaxLength(3);

                entity.Property(p => p.PassportExpirationDate)
                    .HasColumnName("passportExpirationDate")
                    .HasColumnType("date");

                entity.Property(p => p.PlaceOfBirth)
                    .HasColumnName("placeOfBirth")
                    .HasMaxLength(30);

                entity.Property(p => p.Nationality)
                    .HasColumnName("nationality")
                    .HasMaxLength(3);

                entity.Property(p => p.PassengerType)
                    .HasColumnName("passengerType")
                    .HasConversion<string>()
                    .IsRequired();
                
                entity.Property(p => p.OwnerUserId)
                    .HasColumnName("ownerUserId")
                    .HasMaxLength(50);

                entity.HasOne(p => p.User)
                    .WithMany()
                    .HasForeignKey(p => p.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(p => p.OwnerUser)
                    .WithMany()
                    .HasForeignKey(p => p.OwnerUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
            
            modelBuilder.Entity<Seating>()
                .HasKey(s => new { s.flightNum, s.seatNumber });
            
            modelBuilder.Entity<Seating>()
                .Property(s => s.seatStatus)
                .HasConversion<string>();
            
            modelBuilder.Entity<Seating>()
                .Property(s => s.seatclass)
                .HasConversion<string>();

            modelBuilder.Entity<Ticket>()
                        .HasOne(t => t.Seating)
                        .WithMany()
                        .HasForeignKey(t => new { t.flightCode, t.seatNumber });
            
            modelBuilder.Entity<Ticket>()
                .Property(t => t.status)
                .HasConversion<string>();

            modelBuilder.Entity<Ticket>()
                .Property(t => t.ticketClass)
                .HasConversion<string>();
            
            modelBuilder.Entity<FlightPricing>()
                        .HasKey(f=>new{f.FlightNum,f.CabinClass});
            
            modelBuilder.Entity<Airport>()
                        .HasKey(a => a.airportCode);

            modelBuilder.Entity<Booking>()
                        .Property(b => b.bookingStatus)
                        .HasConversion<string>();
            
            modelBuilder.Entity<Employee>(entity =>
            {
                entity.ToTable("Employees");

                entity.HasKey(e => e.employeeId);

                entity.Property(e => e.employeeId)
                    .HasColumnName("employeeId")
                    .HasMaxLength(50);

                entity.Property(e => e.userId)
                    .HasColumnName("userId")
                    .HasMaxLength(50);

                entity.Property(e => e.workEmail)
                    .HasColumnName("workEmail")
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.workPhone)
                    .HasColumnName("workPhone");

                entity.Property(e => e.jobTitle)
                    .HasColumnName("jobTitle")
                    .HasMaxLength(50);

                entity.Property(e => e.department)
                    .HasColumnName("department")
                    .HasConversion(
                        v => ConvertDepartmentToDb(v),
                        v => ConvertDepartmentFromDb(v)
                    )
                    .IsRequired();

                entity.Property(e => e.hire_date)
                    .HasColumnName("hire_date")
                    .HasColumnType("date");

                entity.Property(e => e.workLocation)
                    .HasColumnName("workLocation")
                    .HasMaxLength(3)
                    .IsRequired();

                entity.Property(e => e.status)
                    .HasColumnName("status")
                    .HasConversion(
                        v => ConvertWorkStatusToDb(v),
                        v => ConvertWorkStatusFromDb(v)
                    )
                    .IsRequired();

                entity.Property(e => e.IsAdmin)
                    .HasColumnName("isAdmin")
                    .IsRequired();

                entity.HasOne(e => e.Users)
                    .WithMany()
                    .HasForeignKey(e => e.userId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Aiport)
                    .WithMany()
                    .HasForeignKey(e => e.workLocation)
                    .OnDelete(DeleteBehavior.Restrict);
            });
            
            modelBuilder.Entity<FlightCrewAssignment>(entity =>
            {
                entity.ToTable("FlightCrewAssignment");

                entity.HasKey(x => new { x.flightNum, x.employeeId });

                entity.Property(x => x.flightNum)
                    .HasColumnName("flightNum")
                    .IsRequired();

                entity.Property(x => x.employeeId)
                    .HasColumnName("employeeId")
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(x => x.assignedAt)
                    .HasColumnName("assignedAt");

                entity.HasOne(x => x.Flight)
                    .WithMany()
                    .HasForeignKey(x => x.flightNum)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Employee)
                    .WithMany()
                    .HasForeignKey(x => x.employeeId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<Baggage>(entity =>
            {
                entity.ToTable("Baggage");
                
                entity.HasKey(b => b.baggageID);
                
                entity.Property(b => b.baggageID)
                    .HasColumnName("baggageId")
                    .HasMaxLength(30)
                    .IsRequired();

                entity.Property(b => b.additionalBaggage)
                    .HasColumnName("additionalBaggage")
                    .HasDefaultValue(false);

                entity.Property(b => b.additionalFare)
                    .HasColumnName("additionalFare");

                entity.Property(b => b.isChecked)
                    .HasColumnName("isChecked")
                    .IsRequired();

                entity.Property(b => b.ticketCode)
                    .HasColumnName("ticketCode")
                    .HasMaxLength(30)
                    .IsRequired();

                entity.HasOne(b => b.Passenger)
                    .WithMany()
                    .HasForeignKey(b => b.PassengerId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(b => b.Ticket)
                    .WithMany()
                    .HasForeignKey(b => b.ticketCode)
                    .OnDelete(DeleteBehavior.Restrict);
            });
            
            modelBuilder.Entity<Payment>()
                .Property(p => p.paymentStatus)
                .HasConversion<string>();
            
        }

        private static string? ConvertTitleToDb(UserTitle? title)
        {
            if (title == null) return null;

            switch (title)
            {
                case UserTitle.Dr: return "Dr.";
                case UserTitle.Ms: return "Ms.";
                case UserTitle.Mr: return "Mr.";
                case UserTitle.Miss: return "Miss.";
                case UserTitle.Mrs: return "Mrs.";
                case UserTitle.Mstr: return "Mstr.";
                case UserTitle.Prof: return "Prof";
                case UserTitle.Rev: return "Rev.";
                default: return null;
            }
        }

        private static UserTitle? ConvertTitleFromDb(string? title)
        {
            if (string.IsNullOrEmpty(title)) return null;

            switch (title)
            {
                case "Dr.": return UserTitle.Dr;
                case "Ms.": return UserTitle.Ms;
                case "Mr.": return UserTitle.Mr;
                case "Miss.": return UserTitle.Miss;
                case "Mrs.": return UserTitle.Mrs;
                case "Mstr.": return UserTitle.Mstr;
                case "Prof": return UserTitle.Prof;
                case "Rev.": return UserTitle.Rev;
                default: return null;
            }
        }

        private static string? ConvertGenderToDb(Gender? gender)
        {
            if (gender == null) return null;

            switch (gender)
            {
                case Gender.Male: return "Male";
                case Gender.Female: return "Female";
                case Gender.NonBinary: return "Non-Binary";
                case Gender.Other: return "Other";
                default: return null;
            }
        }

        private static Gender? ConvertGenderFromDb(string? gender)
        {
            if (string.IsNullOrEmpty(gender)) return null;

            switch (gender)
            {
                case "Male": return Gender.Male;
                case "Female": return Gender.Female;
                case "Non-Binary": return Gender.NonBinary;
                case "Other": return Gender.Other;
                default: return null;
            }
        }

        private static TicketStatus? ConvertTicketStatusFromDb(string? ticketStatus)
        {
            if (string.IsNullOrEmpty(ticketStatus)) return null;

            switch (ticketStatus)
            {
                case "Booked": return TicketStatus.Booked;
                case "Cancelled": return TicketStatus.Cancelled;
                case "Pending": return TicketStatus.Pending;
                default: return null;
            }
        }

        private static TicketClass? ConvertTicketClassFromDb(string? ticketClass)
        {
            if (string.IsNullOrEmpty(ticketClass)) return null;

            switch (ticketClass)
            {
                case "Economy": return TicketClass.Economy;
                case "Buisness": return TicketClass.Business;
                case "First": return TicketClass.First;
                default: return null;
            }
        }
        
        private static string ConvertWorkStatusToDb(WorkStatus status) =>
            status switch
            {
                WorkStatus.Active     => "Active",
                WorkStatus.OnLeave    => "On Leave",
                WorkStatus.Terminated => "Terminated",
                _                     => "Active",
            };

        private static WorkStatus ConvertWorkStatusFromDb(string? status) =>
            status switch
            {
                "Active"     => WorkStatus.Active,
                "On Leave"   => WorkStatus.OnLeave,
                "Terminated" => WorkStatus.Terminated,
                _            => WorkStatus.Active,
            };
        
        private static string ConvertDepartmentToDb(EmployeeDepartment department) =>
            department switch
            {
                EmployeeDepartment.CabinCrew => "Cabin Crew",
                EmployeeDepartment.FlightOps => "Flight Ops",
                EmployeeDepartment.Administrative => "Administrative",
                _ => "Administrative",
            };

        private static EmployeeDepartment ConvertDepartmentFromDb(string? department) =>
            department switch
            {
                "Cabin Crew" => EmployeeDepartment.CabinCrew,
                "Flight Ops" => EmployeeDepartment.FlightOps,
                "Administrative" => EmployeeDepartment.Administrative,
                _ => EmployeeDepartment.Administrative,
            };
    }
}
