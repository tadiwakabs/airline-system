CREATE TABLE `Employees` (
     `employeeId` varchar(50) NOT NULL,
     `userId` varchar(50) NOT NULL,
     `workEmail` varchar(100) NOT NULL,
     `workPhone` int DEFAULT NULL,
     `jobTitle` varchar(50) DEFAULT NULL,
     `department` varchar(50) DEFAULT NULL,
     `hire_date` date DEFAULT NULL,
     `workLocation` char(3) NOT NULL,
     `status` enum('Active','On Leave','Terminated') NOT NULL,
     `isAdmin` tinyint(1) NOT NULL,
     PRIMARY KEY (`employeeId`),
     UNIQUE KEY `user` (`userId`),
     UNIQUE KEY `workEmail` (`workEmail`),
     KEY `fk_employee_airport` (`workLocation`),
     CONSTRAINT `fk_employee_airport` FOREIGN KEY (`workLocation`) REFERENCES `Airport` (`airportCode`) ON DELETE RESTRICT ON UPDATE CASCADE,
     CONSTRAINT `fk_employee_user` FOREIGN KEY (`userId`) REFERENCES `Users` (`userId`) ON DELETE RESTRICT ON UPDATE CASCADE,
     CONSTRAINT `Employee_chk_1` CHECK ((`workEmail` like _utf8mb4'%@airline.com%'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
