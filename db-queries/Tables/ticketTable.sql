CREATE TABLE `Ticket` (
      `ticketCode` varchar(30) NOT NULL,
      `bookingId` varchar(50) NOT NULL,
      `price` decimal(8,2) NOT NULL,
      `issueDate` date NOT NULL,
      `origin` varchar(100) NOT NULL,
      `destination` varchar(100) NOT NULL,
      `boardingTime` varchar(30) DEFAULT NULL,
      `seatNumber` char(3) NOT NULL,
      `flightCode` int NOT NULL,
      `status` enum('Booked','Cancelled','Pending') DEFAULT NULL,
      `specialRequest` tinyint(1) DEFAULT NULL,
      `requestType` varchar(100) DEFAULT NULL,
      `ticketClass` enum('Economy','Business','First') DEFAULT NULL,
      `passengerId` varchar(50) NOT NULL,
      `reservationTime` datetime DEFAULT NULL,
      `expiresAt` datetime DEFAULT NULL,
      PRIMARY KEY (`ticketCode`),
      UNIQUE KEY `uq_ticket_flight_seat` (`flightCode`,`seatNumber`),
      KEY `fk_ticket_booking` (`bookingId`),
      KEY `fk_ticket_seating` (`flightCode`,`seatNumber`),
      KEY `fk_ticket_passenger` (`passengerId`),
      CONSTRAINT `fk_ticket_booking` FOREIGN KEY (`bookingId`) REFERENCES `Booking` (`bookingId`) 
          ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT `fk_ticket_flight` FOREIGN KEY (`flightCode`) REFERENCES `Flight` (`flightNum`) 
          ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT `fk_ticket_passenger` FOREIGN KEY (`passengerId`) REFERENCES `Passenger` (`passengerId`) 
          ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT `fk_ticket_seating` FOREIGN KEY (`flightCode`, `seatNumber`) REFERENCES `Seating` (`flightNum`, `seatNumber`) 
          ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT `Ticket_price_chk` CHECK ((`price` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
