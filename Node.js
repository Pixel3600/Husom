const WebSocket = require("ws");

const server = new WebSocket.Server({ port: 8080 });

let players = {};
let bullets = [];

server.on("connection", (socket) => {
    const playerId = Math.random().toString(36).substr(2, 9);
    players[playerId] = { x: Math.random() * 760, y: 550, hp: 3 }; // Minden játékosnak 3 HP

    socket.send(JSON.stringify({ type: "init", id: playerId }));

    socket.on("message", (message) => {
        const data = JSON.parse(message);
        
        if (data.type === "move") {
            players[data.id].x += data.direction === "left" ? -5 : 5;
        }
        
        if (data.type === "shoot") {
            bullets.push({ x: players[data.id].x + 20, y: players[data.id].y, speed: -5, owner: data.id });
        }

        checkCollisions();
        broadcastGameState();
    });

    socket.on("close", () => {
        delete players[playerId];
        broadcastGameState();
    });

    function checkCollisions() {
        bullets.forEach((bullet, index) => {
            for (const id in players) {
                if (id !== bullet.owner) { // Ne találja el saját magát
                    const player = players[id];
                    if (bullet.x > player.x && bullet.x < player.x + 40 && bullet.y > player.y && bullet.y < player.y + 20) {
                        player.hp -= 1;
                        bullets.splice(index, 1);

                        if (player.hp <= 0) {
                            delete players[id]; // Játékos kiesik
                        }
                    }
                }
            }
        });
    }

    function broadcastGameState() {
        server.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "update", players, bullets }));
            }
        });
    }
});

console.log("WebSocket szerver fut a 8080-as porton...");
