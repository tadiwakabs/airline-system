-- Insert
CREATE DEFINER=`sam`@`%` TRIGGER `arrival_departure_insert` BEFORE INSERT ON `Flight` FOR EACH ROW begin
    if new.arrivalTime <= new.departTime then
        signal sqlstate '45000'
            set message_text = 'Arrival time must be after departure time';
    end if;
end;

-- Update
CREATE DEFINER=`sam`@`%` TRIGGER `arrival_departure_update` BEFORE UPDATE ON `Flight` FOR EACH ROW begin
    if new.arrivalTime <= new.departTime then
        signal sqlstate '45000'
set message_text = 'Arrival time must be after departure time';
end if;
end;
