import React from 'react';

function Employee() {
    return (
        <div>
            <h1>Employee Dashboard</h1>

            <h3>Options</h3>

            <ul>
                <li><a href="/flights">View Flights</a></li>
                <li><a href="/add-flight">Add Flight</a></li>
                <li><a href="/passenger-list">Passenger List</a></li>
                <li><a href="/profile">Profile</a></li>
            </ul>
        </div>
    );
}

export default Employee;