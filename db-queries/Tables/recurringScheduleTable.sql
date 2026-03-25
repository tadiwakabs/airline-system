CREATE TABLE `RecurringSchedule` (
    `id`                  INT            NOT NULL AUTO_INCREMENT,
    `departingPort`       CHAR(3)        NOT NULL,
    `arrivingPort`        CHAR(3)        NOT NULL,
    `departureTimeOfDay`  TIME           NOT NULL,
    `arrivalTimeOfDay`    TIME           NOT NULL,
    `aircraftUsed`        VARCHAR(10)    NOT NULL,
    `status`              ENUM('On Time','Delayed','Cancelled','Boarding','Departed','Airborne') NOT NULL,
    `isDomestic`          TINYINT(1)     NOT NULL,
    `distance`            INT            NOT NULL,
    `flightChange`        TINYINT(1)     DEFAULT NULL,
    `startDate`           DATE           NOT NULL,
    `endDate`             DATE           NOT NULL,
    `daysOfWeek`          VARCHAR(20)    NOT NULL COMMENT 'Comma-separated day numbers 0=Sun … 6=Sat',
    `createdAt`           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt`           DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `fk_rs_depart_airport` (`departingPort`),
    KEY `fk_rs_arrive_airport` (`arrivingPort`),
    KEY `fk_rs_aircraft`       (`aircraftUsed`),
    CONSTRAINT `fk_rs_depart_airport` FOREIGN KEY (`departingPort`) REFERENCES `Airport`  (`airportCode`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_rs_arrive_airport` FOREIGN KEY (`arrivingPort`)  REFERENCES `Airport`  (`airportCode`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `fk_rs_aircraft`       FOREIGN KEY (`aircraftUsed`)  REFERENCES `Aircraft` (`tailNumber`)  ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Link Flight rows to their schedule (nullable — one-off flights have NULL)
ALTER TABLE `Flight`
    ADD COLUMN `recurringScheduleId` INT DEFAULT NULL AFTER `flightChange`,
    ADD KEY `fk_flight_schedule` (`recurringScheduleId`),
    ADD CONSTRAINT `fk_flight_schedule`
        FOREIGN KEY (`recurringScheduleId`)
        REFERENCES `RecurringSchedule` (`id`)
        ON DELETE SET NULL   -- schedule deleted → flights stay but are unlinked
        ON UPDATE CASCADE;
