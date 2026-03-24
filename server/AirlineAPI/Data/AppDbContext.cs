using AirlineAPI.Models;
using Microsoft.EntityFrameworkCore;

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
        public DbSet<Passenger> Passenger{get;set;}
        public DbSet<RecurringSchedule> RecurringSchedules { get; set; }


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
    }
}
