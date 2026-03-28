import React, { useEffect, useState } from "react";
import {
    getTicket,
    modifyTicket,
    deleteTicket,
    addTicket,
} from "../../services/ticketService";

const EmptyForm = {
    ticketCode: "",
    bookingId: "",
    price: "",
    issueDate: "",
    origin: "",
    destination: "",
    boardingTime: "",
    seatNumber: "",
    flightCode: "",
    status: "",
    ticketClass: "",
    passengerId: "",
    reservationTime: "",
    datetime: "",
};

export default function Ticket()
{
}