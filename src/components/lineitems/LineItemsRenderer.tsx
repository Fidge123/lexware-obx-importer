import { netTotal } from "../../obx.ts";
import type { LineItem, Quotation } from "../../types.ts";
import { LineItemComponent } from "./LineItemComponent.tsx";

export function LineItemsRenderer({
  payload,
  shippingCalculated,
  onItemDeleted,
  onItemChanged,
}: Props) {
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
            shippingCalculated={shippingCalculated}
            onItemChanged={onItemChanged}
            onItemDeleted={onItemDeleted}
          />
        ))}
      </div>
      <p className="flex justify-between border-gray-300 border-t bg-gray-100 px-4 py-2 font-semibold">
        Nettosumme gesamt
        <span>
          {netTotal(payload.lineItems).toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
          })}
        </span>
      </p>
    </div>
  );
}

interface Props {
  payload?: Quotation;
  shippingCalculated: boolean;
  onItemDeleted: (index: number) => void;
  onItemChanged: (index: number, item: LineItem) => void;
}
