CREATE TABLE `FlightPricing` (
     `flightNum`   INT NOT NULL,
     `cabinClass`  ENUM('Economy', 'Business', 'First') NOT NULL,
     `price`       DECIMAL(10, 2) NOT NULL,
     PRIMARY KEY (`flightNum`, `cabinClass`),
     CONSTRAINT `fk_pricing_flight` FOREIGN KEY (`flightNum`)
         REFERENCES `Flight` (`flightNum`) ON DELETE CASCADE ON UPDATE CASCADE,
     CONSTRAINT `chk_price_positive` CHECK (`price` > 0)
);
