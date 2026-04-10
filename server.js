 const express = require('express');
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');
require('dotenv').config();
const db = require('./config/db');

const app = express();
const server = http.createServer(app);
const io = socketio(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/ads', require('./routes/ads'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Mess App Backend Running!' });
});

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
