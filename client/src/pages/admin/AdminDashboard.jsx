import React from 'react';
import Button from '../../components/common/Button';

function Admin() {
    return (
        <div>
            <h1>Admin Dashboard</h1>

            <h3>Options</h3>

            <ul>
                <li><a href="/flights"><Button>Manage Flights</Button></a></li>
                <li><a href="/add-flight"><Button>Add Flight</Button></a></li>
                <li><a href="/aircraft"><Button>Manage Aircraft</Button></a></li>
                <li><a href="/reports"><Button>Reports</Button></a></li>
                <li><a href="/profile"><Button>Profile</Button></a></li>
            </ul>
        </div>
    );
}

export default Admin;