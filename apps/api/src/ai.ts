import { createAnthropic } from "@ai-sdk/anthropic";
import { createMCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio";
import { generateText, stepCountIs } from "ai"; // 1. Import stepCountIs
import "dotenv/config";

const anthropic = createAnthropic({
  apiKey:
    process.env.ANTHROPIC_API_KEY ||
    "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",
});

const transport = new Experimental_StdioMCPTransport({
  command: "node",
  args: ["D:/code sources/openproject-ai/apps/api/dist/mcp/server.js"],
});
const client = await createMCPClient({
  transport,
});

try {
  const tools = await client.tools();

  const result = await generateText({
    // 3. Sử dụng đúng instance Google provider và model mà bạn muốn
    // model: google("gemini-4-argon"), // Hoặc model Gemini khác mà bạn có quyền truy cập
    model: anthropic("claude-sonnet-5"),
    tools,
    prompt:
      "What is the weather in San Francisco and what attractions should I visit?",
    // 4. Thêm stopWhen, cho phép AI thực hiện tối đa 5 bước
    // Điều này đảm bảo sau khi gọi tool xong, nó sẽ tiếp tục tạo câu trả lời cuối cùng
    stopWhen: stepCountIs(5),
  });

  console.log(result.text);
} catch (error) {
  console.error("Error:", error);
} finally {
  await client.close();
}
