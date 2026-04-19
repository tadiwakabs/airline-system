CREATE TRIGGER cancel_tickets_and_notify_on_flight_cancellation
AFTER UPDATE ON Flight
FOR EACH ROW
BEGIN
    IF NEW.status = 'Cancelled' AND OLD.status <> 'Cancelled' THEN

        INSERT INTO Notification
        (userId, bookingId, flightNum, message, createdAt, notificationStatus)
        SELECT DISTINCT
            b.userId,
            t.bookingId,
            NULL,
            CONCAT(
                'Your flight (#',
                NEW.flightNum,
                ') was cancelled. A refund of $',
                FORMAT(t.price, 2),
                ' has been issued, along with a reimbursement of $',
                FORMAT(t.price * 0.10, 2),
                '.'
            ),
            NOW(),
            'Unread'
        FROM Ticket t
        JOIN Booking b
            ON b.bookingId = t.bookingId
        WHERE t.flightCode = NEW.flightNum;

    END IF;
END;