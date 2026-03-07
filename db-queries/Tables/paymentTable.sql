CREATE TABLE `Payment` (
       `transactionId` int NOT NULL AUTO_INCREMENT,
       `userId` varchar(50) NOT NULL,
       `bookingId` varchar(50) NOT NULL,
       `bookingPrice` double NOT NULL,
       `totalPrice` double NOT NULL,
       `paymentMethod` varchar(30) DEFAULT NULL,
       `paymentStatus` enum('Pending','Success','Failed','Cancelled','Refunded') DEFAULT NULL,
       PRIMARY KEY (`transactionId`),
       UNIQUE KEY `uq_payment_booking` (`bookingId`),
       KEY `payer` (`userId`),
       CONSTRAINT `fk_payment_user` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) 
           ON DELETE RESTRICT ON UPDATE CASCADE,
       CONSTRAINT `uq_payment_booking` FOREIGN KEY (`bookingId`) REFERENCES `Booking` (`bookingId`) 
           ON DELETE RESTRICT ON UPDATE CASCADE,
       CONSTRAINT `Payment_chk_1` CHECK ((`bookingPrice` >= 0)),
       CONSTRAINT `Payment_chk_2` CHECK ((`totalPrice` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
