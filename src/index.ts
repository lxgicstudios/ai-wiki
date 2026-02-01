import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error(
      "Missing OPENAI_API_KEY environment variable.\n" +
      "Get one at https://platform.openai.com/api-keys then:\n" +
      "  export OPENAI_API_KEY=sk-..."
    );
    process.exit(1);
  }
  return new OpenAI({ apiKey });
}

export async function generate(input: string): Promise<string> {
  const openai = getOpenAI();
  const files = fs.readdirSync(input, { recursive: true }) as string[];
  const codeFiles = files.filter((f: string) => /\.(ts|tsx|js|jsx)$/.test(f)).slice(0, 25);
  const contents = codeFiles.map((f: string) => {
    try { return `--- ${f} ---\n` + fs.readFileSync(path.join(input, f), "utf-8").slice(0, 2000); } catch { return ""; }
  }).join("\n\n");
  const userContent = `Generate wiki documentation for this codebase:\n\n${contents}`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: `You are a technical documentation expert. Analyze the codebase and generate comprehensive wiki pages in markdown. Include: Overview, Architecture, Module docs, API reference, and Getting Started. Create interlinked pages with a table of contents. Be thorough but readable.` },
      { role: "user", content: userContent }
    ],
    temperature: 0.7,
  });
  return response.choices[0].message.content || "";
}
