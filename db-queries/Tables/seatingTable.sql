CREATE TABLE `Seating` (
       `flightNum` int NOT NULL,
       `seatNumber` char(3) NOT NULL,
       `seatStatus` enum('Available','Reserved','Occupied') NOT NULL DEFAULT 'Available',
       `passengerId` varchar(50) DEFAULT NULL,
       `holdExpiresAt` datetime DEFAULT NULL,
       `seatClass` enum('Economy','Business','First') DEFAULT NULL,
       PRIMARY KEY (`flightNum`,`seatNumber`),
       KEY `FK_Seating_Passenger` (`passengerId`),
       CONSTRAINT `fk_seating_flight` FOREIGN KEY (`flightNum`) REFERENCES `Flight` (`flightNum`) ON DELETE CASCADE ON UPDATE CASCADE,
       CONSTRAINT `FK_Seating_Passenger` FOREIGN KEY (`passengerId`) REFERENCES `Passenger` (`passengerId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
