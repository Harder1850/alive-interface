declare function require(name: string): any;
declare const process: any;

const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function runIntentFromCli(intent: string): Promise<void> {
  const response = await fetch("http://localhost:4174/api/intent/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ intent }),
  });

  const payload = (await response.json()) as {
    ok: boolean;
    status: string;
    message: string;
    output?: string;
    threadId?: string;
    latestIssue?: string;
  };

  console.log("Intent status:", payload.status);
  console.log("Message:", payload.message);
  if (payload.output) console.log("Output:", payload.output);
  if (payload.threadId) console.log("Thread:", payload.threadId);
  if (payload.latestIssue) console.log("Latest issue:", payload.latestIssue);
}

rl.question("What do you want to do? ", async (input: string) => {
  try {
    await runIntentFromCli(input);
  } catch (error) {
    console.error("Interface relay failed:", error instanceof Error ? error.message : String(error));
  } finally {
    rl.close();
  }
});
