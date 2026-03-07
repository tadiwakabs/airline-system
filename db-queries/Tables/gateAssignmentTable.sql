CREATE TABLE `GateAssignment` (
      `flightNum` int NOT NULL,
      `gateDeparture` varchar(30) DEFAULT NULL,
      `gateArrival` varchar(30) DEFAULT NULL,
      `gateStatus` enum('Delayed','Unloading','Boarding','Closed') DEFAULT NULL,
      PRIMARY KEY (`flightNum`),
      CONSTRAINT `GateAssignment_ibfk_1` FOREIGN KEY (`flightNum`) REFERENCES `Flight` (`flightNum`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
