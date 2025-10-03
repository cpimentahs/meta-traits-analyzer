const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static('.'));

// Serve the images directory
app.use('/images', express.static(path.join(__dirname, 'images')));

// Serve the dashboard at root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'ad-dashboard.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║   🚀 Ad Dashboard Server Running!          ║
║                                            ║
║   Local:    http://localhost:${PORT}         ║
║   Network:  http://0.0.0.0:${PORT}           ║
║                                            ║
║   Press Ctrl+C to stop the server          ║
║                                            ║
╚════════════════════════════════════════════╝
    `);
});