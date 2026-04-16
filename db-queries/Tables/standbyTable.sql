CREATE TABLE `Standby` (
       `standbyId` int NOT NULL AUTO_INCREMENT,
       `flightNum` int NOT NULL,
       `passengerId` varchar(50) NOT NULL,
       `requestTime` datetime NOT NULL,
       `standbyStatus` varchar(20) NOT NULL DEFAULT 'Waiting',
       `offerExpiresAt` datetime DEFAULT NULL,
       PRIMARY KEY (`standbyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
