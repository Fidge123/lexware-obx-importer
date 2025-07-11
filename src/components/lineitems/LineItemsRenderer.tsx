import React from "react";
import type { LineItem, Quotation } from "../../types.ts";
import { LineItemComponent } from "./LineItemComponent.tsx";

interface LineItemsRendererProps {
  payload?: Quotation;
  onItemDeleted: (index: number) => void;
  onItemChanged: (index: number, item: LineItem) => void;
}

export const LineItemsRenderer: React.FC<LineItemsRendererProps> = ({
  payload,
  onItemDeleted,
  onItemChanged,
}) => {
  if (!payload) {
    return null;
  }

  return (
    <div id="line-items-container">
      <h3>Positionen</h3>
      <div id="line-items-list">
        {payload.lineItems.map((item, index) => (
          <LineItemComponent
            key={index}
            item={item}
            index={index}
            onItemChanged={onItemChanged}
            onItemDeleted={onItemDeleted}
          />
        ))}
      </div>
    </div>
  );
};
