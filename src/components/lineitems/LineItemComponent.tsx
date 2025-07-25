import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import type {
  LineItem,
  CustomLineItem,
  SubLineItem,
  TextLineItem,
} from "../../types.ts";
import { DeleteButton } from "./DeleteButton.tsx";
import { InputField } from "./InputField.tsx";

const isTextItem = (item: LineItem): item is TextLineItem => {
  return "type" in item && item.type === "text";
};

const hasEditableControls = (
  item: LineItem,
): item is CustomLineItem | SubLineItem => {
  return "quantity" in item && "unitPrice" in item;
};

export function LineItemComponent({
  item,
  index,
  onItemChanged,
  onItemDeleted,
}: Props) {
  const handleQuantityChange = (value: string) => {
    if (hasEditableControls(item)) {
      item.quantity = parseFloat(value) || 0;
      onItemChanged(index, item);
    }
  };

  const handleNetAmountChange = (value: string) => {
    if (hasEditableControls(item)) {
      item.unitPrice.netAmount = parseFloat(value) || 0;
      onItemChanged(index, item);
    }
  };

  return (
    <div
      className={`py-4 px-4 space-y-3 ${isTextItem(item) ? "bg-gray-100" : ""}`}
      data-index={index.toString()}
    >
      <div className="flex justify-between flex-col">
        <h3>{item.name}</h3>
        {item.description && (
          <Disclosure>
            <DisclosureButton
              as="span"
              className="text-left line-clamp-1 w-fit max-w-2xl text-gray-500 text-sm mt-1 hover:text-gray-800"
            >
              {item.description}
            </DisclosureButton>
            <DisclosurePanel className="bg-inherit">
              <div className="text-sm">{item.description}</div>
            </DisclosurePanel>
          </Disclosure>
        )}
      </div>

      {hasEditableControls(item) && (
        <div className="flex gap-8 items-center">
          <InputField
            label="Anzahl"
            type="number"
            value={item.quantity.toString()}
            onChange={handleQuantityChange}
          />

          <InputField
            label="Nettobetrag"
            type="number"
            value={item.unitPrice.netAmount.toString()}
            onChange={handleNetAmountChange}
          />

          <DeleteButton index={index} onDelete={onItemDeleted} />
        </div>
      )}
    </div>
  );
}

interface Props {
  item: LineItem;
  index: number;
  onItemChanged: (index: number, item: LineItem) => void;
  onItemDeleted: (index: number) => void;
}
