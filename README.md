# Civic Issue Reporting System

A full-stack web application designed to help citizens report civic issues (such as water leaks, road damage, and power outages), allow technicians to manage and resolve them, and provide an admin dashboard for oversight.

## Project Structure

This repository is split into components:
- `backend/`: Node.js/Express server handling APIs, authentication, and database interactions.
- `web-app/`: Web frontend (if applicable).
- `mobile-app/`: React Native mobile application for citizens and technicians.

## Features

- **Citizen Portal**: Report issues with location and multimedia (images/audio), track report status.
- **Technician Dashboard**: View assigned tasks, resolve issues, and update statuses.
- **Admin Dashboard**: Overview of all reported issues, assign issues to technicians, and view analytics.
- **High-Risk Flagging**: Automatically flags issues based on keywords or multiple reports in a nearby area.

## Tech Stack

## Tech Stack

- **React Native** (and React)
- **Node.js & Express.js**
- **MongoDB**
- **JavaScript**

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB instance (Atlas or local)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend/` directory and add your confidential variables:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend / App Setup
1. Navigate to the web/app directory:
   ```bash
   cd web-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm run dev
   ```

## Note on Fallback Mode
If the MongoDB connection fails, the backend will automatically enter a fallback mode, storing data locally in memory and a `fallback_data.json` file to allow continued testing and development.
