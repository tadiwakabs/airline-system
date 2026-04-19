CREATE ALGORITHM=UNDEFINED DEFINER=`aulia`@`%` SQL SECURITY DEFINER 
    VIEW `vw_financial_revenue` AS 
    select `f`.`flightNum` AS `flightNum`,
           `f`.`departingPort` AS `origin`,
           `f`.`arrivingPort` AS `destination`,
           cast(count(distinct `t`.`ticketCode`) as signed) AS `passengers`,
           coalesce(sum(`t`.`price`),0) AS `totalRevenue`,
           coalesce(sum((coalesce(`p`.`refundAmount`,0) + coalesce(`p`.`reimbursementAmount`,0))),0) AS `refundsReimbursements`,
           coalesce(avg(`t`.`price`),0) AS `avgFare`,
           if((
               sum((case when (`t`.`ticketClass` in ('Business','First')) 
                   then `t`.`price` else 0 end)) 
                   > 
               sum((case when (`t`.`ticketClass` = 'Economy') 
                   then `t`.`price` else 0 end))),'Premium','Economy')
               AS `cabinDriver` 
    from ((`Flight` `f` 
        left join `Ticket` `t` on((`t`.`flightCode` = `f`.`flightNum`))) 
        left join `Payment` `p` on((`t`.`bookingId` = `p`.`bookingId`))) 
    group by `f`.`flightNum`,`f`.`departingPort`,`f`.`arrivingPort`;
