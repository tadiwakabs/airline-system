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
                        v => v switch
                        {
                            UserTitle.Dr => "Dr.",
                            UserTitle.Ms => "Ms.",
                            UserTitle.Mr => "Mr.",
                            UserTitle.Miss => "Miss.",
                            UserTitle.Mrs => "Mrs.",
                            UserTitle.Mstr => "Mstr.",
                            UserTitle.Prof => "Prof",
                            UserTitle.Rev => "Rev.",
                            null => null,
                            _ => null
                        },
                        v => string.IsNullOrEmpty(v) ? null : v switch
                        {
                            "Dr." => UserTitle.Dr,
                            "Ms." => UserTitle.Ms,
                            "Mr." => UserTitle.Mr,
                            "Miss." => UserTitle.Miss,
                            "Mrs." => UserTitle.Mrs,
                            "Mstr." => UserTitle.Mstr,
                            "Prof" => UserTitle.Prof,
                            "Rev." => UserTitle.Rev,
                            _ => null
                        });

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
                        v => v == null ? null : v == Gender.NonBinary ? "Non-Binary" : v.ToString(),
                        v => string.IsNullOrEmpty(v) ? null : v switch
                        {
                            "Male" => Gender.Male,
                            "Female" => Gender.Female,
                            "Non-Binary" => Gender.NonBinary,
                            "Other" => Gender.Other,
                            _ => null
                        });

                entity.Property(u => u.UserRole)
                    .HasColumnName("userRole")
                    .HasConversion<string>()
                    .IsRequired();

                entity.Property(u => u.CreatedAt)
                    .HasColumnName("createdAt");

                entity.Property(u => u.UpdatedAt)
                    .HasColumnName("updatedAt");
            });
        }
    }
}
