CREATE TABLE `FlightPricing` (
     `flightNum` int NOT NULL,
     `cabinClass` enum('Economy','Business','First') NOT NULL,
     `price` decimal(10,2) NOT NULL,
     PRIMARY KEY (`flightNum`,`cabinClass`),
     CONSTRAINT `fk_pricing_flight` FOREIGN KEY (`flightNum`) REFERENCES `Flight` (`flightNum`) ON DELETE CASCADE ON UPDATE CASCADE,
     CONSTRAINT `chk_price_positive` CHECK ((`price` > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
