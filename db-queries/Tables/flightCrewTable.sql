CREATE TABLE `FlightCrewAssignment` (
    `flightNum` INT NOT NULL,
    `employeeId` VARCHAR(50) NOT NULL,
    `assignedAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`flightNum`, `employeeId`),
    KEY `idx_fca_employee` (`employeeId`),
    CONSTRAINT `fk_fca_flight`
        FOREIGN KEY (`flightNum`) REFERENCES `Flight` (`flightNum`)
            ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_fca_employee`
        FOREIGN KEY (`employeeId`) REFERENCES `Employees` (`employeeId`)
            ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
