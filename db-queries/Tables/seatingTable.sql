CREATE TABLE `Seating` (
       `flightNum` int NOT NULL,
       `seatNumber` char(3) NOT NULL,
       `is_Occupied` tinyint(1) DEFAULT '0',
       `seatClass` enum('Economy','Business','First') DEFAULT NULL,
       PRIMARY KEY (`flightNum`,`seatNumber`),
       CONSTRAINT `fk_seating_flight` FOREIGN KEY (`flightNum`) REFERENCES `Flight` (`flightNum`) 
           ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
