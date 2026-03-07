CREATE TABLE `Countries` (
     `code` char(2) NOT NULL,
     `name` varchar(100) NOT NULL,
     `phoneCode` varchar(5) NOT NULL,
     PRIMARY KEY (`code`),
     UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
