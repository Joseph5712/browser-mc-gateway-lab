const http = require("http");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

// HTTP server (útil para health check)
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true }));
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WebSocket Gateway running. Use ws://localhost:" + PORT);
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (ws, req) => {
  const ip = req.socket.remoteAddress;
  const id = Math.random().toString(16).slice(2, 10);

  console.log(`[WS] connected id=${id} ip=${ip}`);

  ws.send(JSON.stringify({ type: "welcome", id, message: "Connected to gateway" }));

  ws.on("message", (data) => {
    const text = data.toString();
    console.log(`[WS] msg id=${id} ->`, text);

    // ping/pong simple
    if (text === "ping") {
      ws.send("pong");
      return;
    }

    // si manda JSON
    try {
      const payload = JSON.parse(text);

      if (payload.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", ts: Date.now() }));
        return;
      }

      ws.send(JSON.stringify({ type: "echo", payload }));
    } catch {
      ws.send(`echo: ${text}`);
    }
  });

  ws.on("close", () => console.log(`[WS] disconnected id=${id}`));
  ws.on("error", (err) => console.log(`[WS] error id=${id}`, err.message));
});

server.listen(PORT, () => {
  console.log(`[HTTP] listening on http://localhost:${PORT}`);
  console.log(`[WS] connect via ws://localhost:${PORT}`);
});
