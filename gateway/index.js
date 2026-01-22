const http = require("http");
const WebSocket = require("ws");
const { pingServer } = require("./mcStatus");

const PORT = process.env.PORT || 8080;
const MC_HOST = process.env.MC_HOST || "127.0.0.1";
const MC_PORT = Number(process.env.MC_PORT || 25565);


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
    if (text === "status") {
    console.log("[WS] status requested");

    pingServer({ host: MC_HOST, port: MC_PORT })
    .then((info) => ws.send(JSON.stringify({ type: "status", info })))
    .catch((err) =>
      ws.send(JSON.stringify({ type: "error", message: err.message }))
    );
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
