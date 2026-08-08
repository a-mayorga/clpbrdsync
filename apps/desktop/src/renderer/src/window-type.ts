export type RendererWindowType = "main" | "quick-paste";

export function getRendererWindowType(): RendererWindowType {
  const params = new URLSearchParams(window.location.search);

  if (params.get("window") === "quick-paste") {
    return "quick-paste";
  }

  return "main";
}
