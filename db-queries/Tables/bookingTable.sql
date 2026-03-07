CREATE TABLE `Booking` (
       `bookingId` varchar(50) NOT NULL,
       `bookingDate` date NOT NULL,
       `bookingStatus` enum('Confirmed','Pending','Cancelled','Completed') NOT NULL,
       `totalPrice` decimal(10,2) NOT NULL,
       `userId` varchar(50) NOT NULL,
       PRIMARY KEY (`bookingId`),
       KEY `fk_booking_user` (`userId`),
       CONSTRAINT `fk_booking_user` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) 
           ON DELETE RESTRICT ON UPDATE CASCADE,
       CONSTRAINT `Booking_chk_1` CHECK ((`totalPrice` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
