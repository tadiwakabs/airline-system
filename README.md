# Airline Ticketing System

A full-stack airline booking system that allows passengers and airline staff to search flights, book tickets, manage reservations, and process payments.

---

# Project Setup

Follow the steps below to run the project locally.

---

# 1. Install Node.js and .NET SDK

Download and insall NodeJS: https://nodejs.org/en/download


Download and install the **.NET SDK**: https://dotnet.microsoft.com/en-us/download/dotnet/9.0

After installation, verify they are available in your terminal.

### Windows

```bash
node -v
npm -v
dotnet --info
```

### macOS

```bash
node -v
npm -v
dotnet --version
```

If the command is not recognized, ensure that Node.js and .NET SDK is added to your system PATH.

---

# 2. Clone the Repository

```bash
git clone https://github.com/tadiwakabs/airline-system.git
cd airline-system
```

---

# 3. Create Environment Files

Two `.env` files are required:

* One for the **client**
* One for the **server**

Each directory contains a `.env.example` file.

Create `.env` files by copying the examples and filling in the required values.

Example:

```bash
cp client/.env.example client/.env
cp server/AirlineAPI/.env.example server/AirlineAPI/.env
```

Then update the server environment variables with your actual username and password.

---

# 4. Install Dependencies

From the **root directory (`airline-system`)**, run:

```bash
npm install
npm run install:client
```

This installs:

* root development dependencies
* client-side dependencies

---

# 5. Start the Application

Run the development environment:

```bash
npm run dev
```

This command starts both the frontend and backend simultaneously.

---

# 6. Expected Output

If everything is configured correctly, your terminal should show something similar to:

```text
[CLIENT] VITE v7.3.1 ready in 483 ms

[CLIENT] ➜ Local:   http://localhost:5173/
[CLIENT] ➜ Network: use --host to expose

[SERVER] Now listening on: http://localhost:5127
[SERVER] Application started. Press Ctrl+C to shut down.
[SERVER] Hosting environment: Development
```

---

# Accessing the Application

Frontend:

```
http://localhost:5173
```

Backend API:

```
http://localhost:5127
```

Health Check Endpoint:

```
http://localhost:5127/api/health
```

---

# Stopping the Application

Press:

```
Ctrl + C
```

in the terminal to stop both services.

---
