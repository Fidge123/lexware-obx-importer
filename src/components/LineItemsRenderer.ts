import { LineItem, Quotation } from "../types.ts";
import { LineItemComponent } from "./LineItemComponent.ts";

export interface LineItemsRendererCallbacks {
  onItemDeleted: (index: number) => void;
  onItemChanged: (index: number, item: LineItem) => void;
}

export class LineItemsRenderer {
  private container: HTMLElement;
  private listElement: HTMLElement;
  private callbacks: LineItemsRendererCallbacks;

  constructor(
    container: HTMLElement,
    listElement: HTMLElement,
    callbacks: LineItemsRendererCallbacks
  ) {
    this.container = container;
    this.listElement = listElement;
    this.callbacks = callbacks;
  }

  /**
   * Renders all line items from the quotation payload
   */
  render(payload: Quotation | undefined): void {
    if (!payload) {
      this.clear();
      return;
    }

    this.listElement.innerHTML = "";
    this.container.style.display = "block";

    payload.lineItems.forEach((item, index) => {
      const lineItemComponent = new LineItemComponent(item, index, {
        onItemChanged: this.callbacks.onItemChanged,
        onItemDeleted: this.callbacks.onItemDeleted,
      });

      this.listElement.appendChild(lineItemComponent.getElement());
    });
  }

  /**
   * Clears all line items and hides the container
   */
  clear(): void {
    this.listElement.innerHTML = "";
    this.container.style.display = "none";
  }
}
