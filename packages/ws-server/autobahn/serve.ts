import { startEchoServer } from "./echo-server";

const port = Number(process.env["PORT"] ?? 9001);

startEchoServer(port).then(({ port: bound }) => {
  process.stdout.write(`ws-server listening on ${bound}\n`);
});
