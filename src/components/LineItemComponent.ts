import {
  LineItem,
  CustomLineItem,
  SubLineItem,
  TextLineItem,
} from "../types.ts";
import { InputField } from "./InputField.ts";
import { DeleteButton } from "./DeleteButton.ts";
import { DescriptionElement } from "./DescriptionElement.ts";

export interface LineItemComponentCallbacks {
  onItemChanged: (index: number, item: LineItem) => void;
  onItemDeleted: (index: number) => void;
}

export class LineItemComponent {
  private element: HTMLElement;
  private item: LineItem;
  private index: number;
  private callbacks: LineItemComponentCallbacks;

  constructor(
    item: LineItem,
    index: number,
    callbacks: LineItemComponentCallbacks
  ) {
    this.item = item;
    this.index = index;
    this.callbacks = callbacks;
    this.element = this.createElement();
  }

  getElement(): HTMLElement {
    return this.element;
  }

  private isTextItem(item: LineItem): item is TextLineItem {
    return "type" in item && item.type === "text";
  }

  private hasEditableControls(
    item: LineItem
  ): item is CustomLineItem | SubLineItem {
    return "quantity" in item && "unitPrice" in item;
  }

  private createElement(): HTMLElement {
    const div = document.createElement("div");
    div.className = `line-item ${
      this.isTextItem(this.item) ? "text-item" : ""
    }`;
    div.dataset.index = this.index.toString();

    const header = this.createHeader();
    div.appendChild(header);

    if (this.hasEditableControls(this.item)) {
      const controls = this.createControls(this.item);
      div.appendChild(controls);
    }

    return div;
  }

  private createHeader(): HTMLElement {
    const header = document.createElement("div");
    header.className = "line-item-header";

    const nameDiv = document.createElement("div");
    nameDiv.className = "line-item-name";
    nameDiv.textContent = this.item.name;

    if (this.item.description) {
      const descriptionComponent = new DescriptionElement(
        this.item.description
      );
      nameDiv.appendChild(descriptionComponent.getElement());
    }

    header.appendChild(nameDiv);
    return header;
  }

  private createControls(item: CustomLineItem | SubLineItem): HTMLElement {
    const controls = document.createElement("div");
    controls.className = "line-item-controls";

    // Quantity input
    const quantityInput = new InputField(
      "Anzahl",
      "number",
      item.quantity.toString(),
      { min: "0", step: "1" },
      (value) => {
        item.quantity = parseFloat(value) || 0;
        this.callbacks.onItemChanged(this.index, item);
      }
    );

    // Net amount input
    const netAmountInput = new InputField(
      "Nettobetrag (€)",
      "number",
      item.unitPrice.netAmount.toString(),
      { min: "0", step: "0.01" },
      (value) => {
        item.unitPrice.netAmount = parseFloat(value) || 0;
        this.callbacks.onItemChanged(this.index, item);
      }
    );

    // Delete button
    const deleteButton = new DeleteButton(this.index, (index) => {
      this.callbacks.onItemDeleted(index);
    });

    controls.appendChild(quantityInput.getElement());
    controls.appendChild(netAmountInput.getElement());
    controls.appendChild(deleteButton.getElement());

    return controls;
  }
}
