import type React from "react";
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
    <div className="mt-4 overflow-hidden rounded-lg border border-gray-300 bg-white shadow">
      <h2 className="border-gray-300 bg-gray-100 px-4 py-2">Positionen</h2>
      <div className="divide-y divide-gray-300">
        {payload.lineItems.map((item, index) => (
          <LineItemComponent
            key={item.name}
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
