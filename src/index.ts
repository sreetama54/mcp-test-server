import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Base config
const NUTRITION_API_BASE = "https://api.api-ninjas.com/v1/nutrition";
const API_KEY = "VFyI2ioAU/JGxhcU2qDh6A==kpQMaygy5VXvu92u"; // safer to store key in env var

// Create MCP server instance
const server = new McpServer({
  name: "nutrition",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

//npm install @modelcontextprotocol/sdk

// Helper for Nutrition API requests
async function makeNutritionRequest<T>(query: string): Promise<T | null> {
  const url = `${NUTRITION_API_BASE}?query=${encodeURIComponent(query)}`;
  const headers = {
    "X-Api-Key": API_KEY || "",
    Accept: "application/json",
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error("Error fetching Nutrition API:", error);
    return null;
  }
}

// Define Nutrition response type
interface NutritionItem {
  name: string;
  serving_size_g: number;
  fat_total_g: number;
  fat_saturated_g: number;
  sodium_mg: number;
  potassium_mg: number;
  cholesterol_mg: number;
  carbohydrates_total_g: number;
  fiber_g: number;
  sugar_g: number;
}

// Format function
function formatNutrition(item: NutritionItem): string {
  return [
    `🍽️ ${item.name}`,
    `Serving Size: ${item.serving_size_g}g`,
    `Carbs: ${item.carbohydrates_total_g}g (Sugar: ${item.sugar_g}g, Fiber: ${item.fiber_g}g)`,
    `Fat: ${item.fat_total_g}g (Saturated: ${item.fat_saturated_g}g)`,
    `Cholesterol: ${item.cholesterol_mg}mg`,
    `Sodium: ${item.sodium_mg}mg`,
    `Potassium: ${item.potassium_mg}mg`,
    "---",
  ].join("\n");
}

// Register Nutrition MCP tool
server.tool(
  "get-nutrition",
  "Get nutrition facts for any food or meal",
  {
    query: z.string().describe("Food item(s) to analyze (e.g. '1lb brisket and fries')"),
  },
  async ({ query }) => {
    // If API key is missing, return a helpful message instead of failing the whole server.
    if (!API_KEY) {
      return {
        content: [
          {
            type: "text",
            text: "Error: Missing API_NINJAS_KEY environment variable. Please set this env var to use the nutrition API.",
          },
        ],
      };
    }

    const data = await makeNutritionRequest<NutritionItem[]>(query);

    if (!data || data.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "No nutrition data found or request failed.",
          },
        ],
      };
    }

    const formatted = data.map(formatNutrition).join("\n");
    const responseText = ` sree's Nutrition analysis for: "${query}"\n\n${formatted}`;

    return {
      content: [
        {
          type: "text",
          text: responseText,
        },
      ],
    };
  },
);

// Start server
async function main() {
  if (!API_KEY) {
    console.error(
      "Warning: Missing API_NINJAS_KEY environment variable. The server will start, but the nutrition tool will return an explanatory message until the key is provided."
    );
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Nutrition MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
