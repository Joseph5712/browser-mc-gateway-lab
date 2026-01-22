const mc = require("minecraft-protocol");

function pingServer({ host = "127.0.0.1", port = 25565 } = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const client = mc.createClient({
      host,
      port,
      username: "status-ping",
      version: false
    });

    const done = (err, data) => {
      try { client.end(); } catch {}
      if (err) return reject(err);
      resolve(data);
    };

    client.once("error", (err) => done(err));

    client.once("server_info", (data) => {
      const latency = Date.now() - start;

      done(null, {
        motd: data.description,
        players: data.players,
        version: data.version,
        latency
      });
    });

    client.once("state", (state) => {
      if (state === "status") {
        client.write("ping_start", {});
      }
    });
  });
}

module.exports = { pingServer };
