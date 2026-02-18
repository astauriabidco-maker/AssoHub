const net = require('net');

const ports = [3000, 3001, 3002, 3333, 4000, 4200, 5000, 8000, 8080];

ports.forEach(port => {
    const s = new net.Socket();
    s.setTimeout(500);
    s.on('connect', () => { console.log(`Open: ${port}`); s.destroy(); });
    s.on('error', (e) => { s.destroy(); });
    s.on('timeout', (e) => { s.destroy(); });
    s.connect(port, '127.0.0.1');
});
