import React from 'react';

function Admin() {
    return (
        <div>
            <h1>Admin Dashboard</h1>

            <h3>Options</h3>

            <ul>
                <li><a href="/flights">Manage Flights</a></li>
                <li><a href="/add-flight">Add Flight</a></li>
                <li><a href="/aircraft">Manage Aircraft</a></li>
                <li><a href="/reports">Reports</a></li>
                <li><a href="/profile">Profile</a></li>
            </ul>
        </div>
    );
}

export default Admin;