export async function ping(message: string) {
  "use workflow";

  await announce(message);
  return { pong: message, at: new Date().toISOString() };
}

async function announce(text: string) {
  "use step";

  console.log(text);
}
