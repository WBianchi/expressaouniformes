import { products } from "./catalog";
import type { Product } from "./catalog";
type Tool = {
  name: string;
  description: string;
  inputSchema: object;
  annotations: { readOnlyHint: boolean };
  execute: (input: unknown) => unknown;
};
type ModelContext = {
  registerTool: (
    tool: Tool,
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};
// Optional browser API: a missing registry must never affect the storefront.
export function registerStoreTools(openStudio: (product: Product) => void) {
  const context = (document as Document & { modelContext?: ModelContext })
    .modelContext;
  if (!context?.registerTool) return;
  const lifecycle = new AbortController();
  const tools: Tool[] = [
    {
      name: "read_uniform_catalog",
      description:
        "Read the demonstration uniform catalog. Does not create an order.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute() {
        return {
          demo: true,
          products: products.map(({ id, name, category, price }) => ({
            id,
            name,
            category,
            illustrativePrice: price,
          })),
        };
      },
    },
    {
      name: "start_uniform_personalization",
      description:
        "Open the product personalization studio. Does not add to cart or place an order.",
      inputSchema: {
        type: "object",
        properties: { productId: { type: "string" } },
        required: ["productId"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false },
      execute(input) {
        if (
          !input ||
          typeof input !== "object" ||
          !("productId" in input) ||
          typeof input.productId !== "string"
        )
          throw new Error("productId is required");
        const product = products.find((p) => p.id === input.productId);
        if (!product) throw new Error("Unknown product");
        openStudio(product);
        return { status: "studio_opened", productId: product.id };
      },
    },
  ];
  for (const tool of tools) {
    try {
      void Promise.resolve(
        context.registerTool(tool, { signal: lifecycle.signal }),
      ).catch(() => {});
    } catch {
      /* Browser support is optional. */
    }
  }
  return () => lifecycle.abort();
}
