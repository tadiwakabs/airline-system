CREATE TABLE `Notification` (
    `notificationId` int NOT NULL AUTO_INCREMENT,
    `userId` varchar(50) NOT NULL,
    `bookingId` varchar(50) DEFAULT NULL,
    `flightNum` int DEFAULT NULL,
    `message` varchar(255) NOT NULL,
    `createdAt` datetime NOT NULL,
    `notificationStatus` varchar(20) NOT NULL DEFAULT 'Unread',
    PRIMARY KEY (`notificationId`)
) ENGINE=InnoDB AUTO_INCREMENT=940 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
