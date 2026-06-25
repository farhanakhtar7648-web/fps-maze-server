const WebSocket = require("ws");

const wss = new WebSocket.Server({
	port: process.env.PORT || 10000
});

let players = {};

console.log("🚀 SERVER RUNNING");


// 🌐 CONNECTION
wss.on("connection", (ws) => {

	console.log("✅ Player Connected");

	ws.on("message", (msg) => {

		let data;

		try {
			data = JSON.parse(msg);
		} catch (e) {
			return;
		}

		// 👤 SET NAME
		if (data.type === "set_name") {

			let username = data.name;
			let playerId = data.id;

			ws.name = username;
			ws.playerId = playerId;

			players[playerId] = {
				ws: ws,
				name: username,
				x: 0,
				y: 5,
				z: 0,
				rot_y: 0,
				anim: "idle"
			};

			ws.send(JSON.stringify({
				type: "name_ok"
			}));

			sendPlayers();
			sendPositions();

			return;
		}

		// 🎮 JOIN MATCH
		if (data.type === "join_match") {

			ws.send(JSON.stringify({
				type: "go_lobby"
			}));

			setTimeout(() => {

				sendPlayers();
				sendPositions();

			}, 300);

			return;
		}

		// 👥 GET PLAYERS
		if (data.type === "get_players") {

			sendPlayers();
			sendPositions();

			return;
		}

		// ▶ START GAME
		if (data.type === "start_game") {

			broadcast({
				type: "start_game"
			});

			return;
		}

		// 📍 POSITION UPDATE
		if (data.type === "pos") {

			if (!players[ws.playerId]) return;

			players[ws.playerId].x = data.x;
			players[ws.playerId].y = data.y;
			players[ws.playerId].z = data.z;
			players[ws.playerId].rot_y = data.rot_y;
			players[ws.playerId].anim = data.anim;

			sendPositions();

			return;
		}
	});

	// ❌ DISCONNECT
	ws.on("close", () => {

		console.log("❌ Left:", ws.name);

		delete players[ws.playerId];

		sendPlayers();
		sendPositions();
	});
});


// 👥 SEND PLAYERS
function sendPlayers() {

	let names = [];

	for (let id in players) {
		names.push(players[id].name);
	}

	broadcast({
		type: "players",
		list: names
	});

	// 🚀 AUTO START AT 6 PLAYERS
	if (names.length >= 6) {

		broadcast({
			type: "start_game"
		});
	}
}


// 📍 SEND POSITIONS
function sendPositions() {

	let list = {};

	for (let id in players) {

		list[id] = {
			name: players[id].name,
			x: players[id].x,
			y: players[id].y,
			z: players[id].z,
			rot_y: players[id].rot_y,
			anim: players[id].anim
		};
	}

	broadcast({
		type: "positions",
		list: list
	});
}


// 📡 BROADCAST
function broadcast(data) {

	let msg = JSON.stringify(data);

	for (let id in players) {

		let client = players[id].ws;

		if (client.readyState === WebSocket.OPEN) {
			client.send(msg);
		}
	}
}