import type { LineItemWithType } from "./types";

export function listen(
  selector: string,
  event: string,
  callback: (e: Event) => void
): () => void {
  const component = document.querySelector(selector);
  if (component) {
    component.addEventListener(event, callback);
    return () => component.removeEventListener(event, callback);
  } else {
    console.warn(`Element with selector "${selector}" not found.`);
    return () => {};
  }
}

export function count(lineItems: LineItemWithType[]): number {
  return lineItems.reduce(
    (count, item) => count + (item.type === "custom" ? item.quantity || 1 : 0),
    0
  );
}
