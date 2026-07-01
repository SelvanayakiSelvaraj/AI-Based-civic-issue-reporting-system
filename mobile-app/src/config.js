// Central API Configuration
// Use your computer's local IP (e.g., 192.168.1.5) if testing on a physical device.
// Use 10.0.2.2 for Android Emulator.
// Use 127.0.0.1 for Web/iOS Simulator.

const BASE_IP = '127.0.0.1'; // <-- CHANGE THIS to your IP address if using a real phone

export const API_URL = `http://${BASE_IP}:5000/api`;
