import React from 'react';
import Button from '../../components/common/Button';
function Employee() {
    return (
        <div>
            <h1>Employee Dashboard</h1>

            <h3>Options</h3>

            <ul>
                <li><a href="/flights"><Button>View Flights</Button></a></li>
                <li><a href="/add-flight"><Button>Add Flight</Button></a></li>
                <li><a href="/passenger-list"><Button>Passenger List</Button></a></li>
                <li><a href="/profile"><Button>Profile</Button></a></li>
            </ul>
        </div>
    );
}

export default Employee;