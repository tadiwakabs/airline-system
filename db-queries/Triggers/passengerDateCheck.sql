-- Insert
CREATE DEFINER=`aulia`@`%` TRIGGER `trg_passenger_checks` BEFORE INSERT ON `Passenger` FOR EACH ROW BEGIN
    IF NEW.passportExpirationDate <= CURDATE() THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Passport expiration date must be in the future';
    END IF;

    IF NEW.dateOfBirth >= CURDATE() OR NEW.dateOfBirth < DATE_SUB(CURDATE(), INTERVAL 120 YEAR) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Date of birth must be in the past and within 120 years';
    END IF;
END;

-- Update
CREATE DEFINER=`aulia`@`%` TRIGGER `trg_passenger_checks_update` BEFORE UPDATE ON `Passenger` FOR EACH ROW BEGIN
    IF NEW.passportExpirationDate <= CURDATE() THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Passport expiration date must be in the future';
    END IF;

    IF NEW.dateOfBirth >= CURDATE() OR NEW.dateOfBirth < DATE_SUB(CURDATE(), INTERVAL 120 YEAR) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Date of birth must be in the past and within 120 years';
    END IF;
END
