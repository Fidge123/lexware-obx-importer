import React from "react";
import type {
  LineItem,
  CustomLineItem,
  SubLineItem,
  TextLineItem,
} from "../types.ts";
import { DeleteButton } from "./DeleteButton.tsx";

interface LineItemComponentProps {
  item: LineItem;
  index: number;
  onItemChanged: (index: number, item: LineItem) => void;
  onItemDeleted: (index: number) => void;
}

const DescriptionElement: React.FC<{
  description: string;
  maxLength?: number;
}> = ({ description, maxLength = 100 }) => {
  const truncated =
    description.length > maxLength
      ? description.substring(0, maxLength)
      : description;
  const isTruncated = description.length > maxLength;

  return (
    <div className={`line-item-description ${isTruncated ? "truncated" : ""}`}>
      {isTruncated ? (
        <>
          {truncated}
          <div className="tooltip">{description}</div>
        </>
      ) : (
        description
      )}
    </div>
  );
};

const InputField: React.FC<{
  label: string;
  type: string;
  value: string;
  min?: string;
  step?: string;
  onChange: (value: string) => void;
}> = ({ label, type, value, min, step, onChange }) => {
  return (
    <div className="line-item-input">
      <label>{label}</label>
      <input
        type={type}
        value={value}
        min={min}
        step={step}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

const isTextItem = (item: LineItem): item is TextLineItem => {
  return "type" in item && item.type === "text";
};

const hasEditableControls = (
  item: LineItem,
): item is CustomLineItem | SubLineItem => {
  return "quantity" in item && "unitPrice" in item;
};

export const LineItemComponent: React.FC<LineItemComponentProps> = ({
  item,
  index,
  onItemChanged,
  onItemDeleted,
}) => {
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
      className={`line-item ${isTextItem(item) ? "text-item" : ""}`}
      data-index={index.toString()}
    >
      <div className="line-item-header">
        <div className="line-item-name">
          {item.name}
          {item.description && (
            <DescriptionElement description={item.description} />
          )}
        </div>
      </div>

      {hasEditableControls(item) && (
        <div className="line-item-controls">
          <InputField
            label="Anzahl"
            type="number"
            value={item.quantity.toString()}
            min="0"
            step="1"
            onChange={handleQuantityChange}
          />

          <InputField
            label="Nettobetrag (€)"
            type="number"
            value={item.unitPrice.netAmount.toString()}
            min="0"
            step="0.01"
            onChange={handleNetAmountChange}
          />

          <DeleteButton index={index} onDelete={onItemDeleted} />
        </div>
      )}
    </div>
  );
};
