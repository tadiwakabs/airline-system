CREATE TABLE `Passenger` (
     `passengerId` varchar(50) NOT NULL,
     `userId` varchar(50) DEFAULT NULL,
     `title` enum('Dr.','Ms.','Mr.','Miss.','Mrs.','Mstr.','Prof','Rev.') DEFAULT NULL,
     `firstName` varchar(30) NOT NULL,
     `lastName` varchar(30) NOT NULL,
     `dateOfBirth` date NOT NULL,
     `gender` enum('Male','Female','Non-Binary','Other') DEFAULT NULL,
     `phoneNumber` int NOT NULL,
     `email` varchar(100) DEFAULT NULL,
     `DLNumber` int DEFAULT NULL,
     `passportNumber` varchar(20) DEFAULT NULL,
     `passportCountryCode` char(3) DEFAULT NULL,
     `passportExpirationDate` date DEFAULT NULL,
     `placeOfBirth` varchar(30) DEFAULT NULL,
     `nationality` char(3) DEFAULT NULL,
     PRIMARY KEY (`passengerId`),
     KEY `FK_Passenger_User` (`userId`),
     CONSTRAINT `fk_passenger_user` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) 
         ON DELETE RESTRICT ON UPDATE CASCADE,
     CONSTRAINT `Passenger_chk_1` CHECK ((`email` like _utf8mb4'%@%.%')),
     CONSTRAINT `Passenger_chk_2` CHECK (((`DLNumber` is not null) or (`passportNumber` is not null)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
