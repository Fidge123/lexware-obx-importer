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
    <div className="mt-4 bg-white border border-gray-300 overflow-hidden rounded-lg shadow">
      <h2 className="px-4 py-2 bg-gray-100 border-gray-300">Positionen</h2>
      <div className="divide-gray-300 divide-y">
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
