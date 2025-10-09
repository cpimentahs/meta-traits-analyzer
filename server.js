const express = require('express');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
require('dotenv').config();
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// Serve the images directory
app.use('/images', express.static(path.join(__dirname, 'images')));

// API endpoint to proxy OpenAI requests
app.post('/api/openai', async (req, res) => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured on server' });
    }

    try {
        const requestBody = JSON.stringify(req.body);

        const options = {
            hostname: 'api.openai.com',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        const apiRequest = https.request(options, (apiResponse) => {
            let data = '';

            apiResponse.on('data', (chunk) => {
                data += chunk;
            });

            apiResponse.on('end', () => {
                res.status(apiResponse.statusCode).send(data);
            });
        });

        apiRequest.on('error', (error) => {
            console.error('OpenAI API Error:', error);
            res.status(500).json({ error: 'Failed to connect to OpenAI API' });
        });

        apiRequest.write(requestBody);
        apiRequest.end();

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// API endpoint to download image
app.post('/api/download-image', async (req, res) => {
    const { ad_id, url } = req.body;

    if (!ad_id || !url) {
        return res.status(400).json({ error: 'Missing ad_id or url' });
    }

    try {
        // Determine file extension from URL
        const ext = url.includes('.jpg') || url.includes('.jpeg') ? '.jpg' : '.png';
        const filename = `${ad_id}${ext}`;
        const filepath = path.join(__dirname, 'images', filename);

        // Download the image
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            if (response.statusCode !== 200) {
                return res.status(400).json({ error: `Failed to download: HTTP ${response.statusCode}` });
            }

            const fileStream = fs.createWriteStream(filepath);
            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                console.log(`✅ Downloaded: ${filename}`);
                res.json({ success: true, filename });
            });

            fileStream.on('error', (err) => {
                fs.unlink(filepath, () => {}); // Delete partial file
                console.error(`❌ Error writing file: ${err.message}`);
                res.status(500).json({ error: 'Failed to save image' });
            });

        }).on('error', (err) => {
            console.error(`❌ Error downloading: ${err.message}`);
            res.status(500).json({ error: `Download failed: ${err.message}` });
        });

    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

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