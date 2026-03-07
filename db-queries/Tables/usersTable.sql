CREATE TABLE `Users` (
     `userId` varchar(50) NOT NULL,
     `username` varchar(50) NOT NULL,
     `passwordHash` varchar(255) NOT NULL,
     `email` varchar(100) NOT NULL,
     `title` enum('Dr.','Ms.','Mr.','Miss.','Mrs.','Mstr.','Prof','Rev.') DEFAULT NULL,
     `firstName` varchar(30) NOT NULL,
     `lastName` varchar(30) NOT NULL,
     `dateOfBirth` date NOT NULL,
     `gender` enum('Male','Female','Non-Binary','Other') DEFAULT NULL,
     `userRole` enum('Passenger','Employee','Administrator') NOT NULL,
     `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
     `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
     PRIMARY KEY (`userId`),
     UNIQUE KEY `username` (`username`),
     UNIQUE KEY `email` (`email`),
     CONSTRAINT `User_chk_1` CHECK ((`email` like _utf8mb4'%@%.%'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
