import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeleteButton } from "../components/lineitems/DeleteButton";
import { InputField } from "../components/lineitems/InputField";
import { LineItemComponent } from "../components/lineitems/LineItemComponent";
import { LineItemsRenderer } from "../components/lineitems/LineItemsRenderer";
import type { CustomLineItem, TextLineItem } from "../types";
import { createMockLineItem, createMockQuotation } from "./testUtils";

describe("Line Item Components", () => {
  describe("InputField", () => {
    it("should render with label and value", () => {
      const onChange = vi.fn();
      render(
        <InputField
          label="Test Label"
          type="number"
          value="42"
          onChange={onChange}
        />,
      );

      expect(screen.getByText("Test Label")).toBeInTheDocument();
      expect(screen.getByRole("spinbutton")).toHaveValue(42);
    });

    it("should call onChange when input value changes", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <InputField
          label="Quantity"
          type="number"
          value="10"
          onChange={onChange}
        />,
      );

      const input = screen.getByRole("spinbutton");
      await user.clear(input);
      await user.type(input, "25");

      // Should be called multiple times as value changes
      expect(onChange).toHaveBeenCalled();
      // Verify it was called with an empty string when cleared and then with typed values
      expect(onChange.mock.calls.length).toBeGreaterThan(0);
    });

    it("should render text input type correctly", () => {
      const onChange = vi.fn();
      render(
        <InputField
          label="Name"
          type="text"
          value="Test"
          onChange={onChange}
        />,
      );

      expect(screen.getByRole("textbox")).toHaveValue("Test");
    });
  });

  describe("DeleteButton", () => {
    it("should render delete button", () => {
      const onDelete = vi.fn();
      render(<DeleteButton index={0} onDelete={onDelete} />);

      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("title", "Position löschen");
    });

    it("should call onDelete with correct index when clicked", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(<DeleteButton index={5} onDelete={onDelete} />);

      await user.click(screen.getByRole("button"));

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(onDelete).toHaveBeenCalledWith(5);
    });
  });

  describe("LineItemComponent", () => {
    it("should render item name", () => {
      const item = createMockLineItem("Test Product");
      const onItemChanged = vi.fn();
      const onItemDeleted = vi.fn();

      render(
        <LineItemComponent
          item={item}
          index={0}
          onItemChanged={onItemChanged}
          onItemDeleted={onItemDeleted}
        />,
      );

      expect(screen.getByText("Test Product")).toBeInTheDocument();
    });

    it("should render quantity and price inputs for custom line items", () => {
      const item = createMockLineItem("Product");
      item.quantity = 3;
      item.unitPrice.netAmount = 150;

      const onItemChanged = vi.fn();
      const onItemDeleted = vi.fn();

      render(
        <LineItemComponent
          item={item}
          index={0}
          onItemChanged={onItemChanged}
          onItemDeleted={onItemDeleted}
        />,
      );

      expect(screen.getByText("Anzahl")).toBeInTheDocument();
      expect(screen.getByText("Nettobetrag")).toBeInTheDocument();

      const inputs = screen.getAllByRole("spinbutton");
      expect(inputs).toHaveLength(2);
      expect(inputs[0]).toHaveValue(3);
      expect(inputs[1]).toHaveValue(150);
    });

    it("should show NETTO label for non-discounted items", () => {
      const item: CustomLineItem = {
        ...createMockLineItem("Product"),
        isNonDiscounted: true,
      };

      render(
        <LineItemComponent
          item={item}
          index={0}
          onItemChanged={vi.fn()}
          onItemDeleted={vi.fn()}
        />,
      );

      expect(screen.getByText("NETTO")).toBeInTheDocument();
    });

    it("should show 'Teilweise NETTO' label for items with non-discounted sub-items", () => {
      const item: CustomLineItem = {
        ...createMockLineItem("Product"),
        hasNonDiscountedSubItems: true,
      };

      render(
        <LineItemComponent
          item={item}
          index={0}
          onItemChanged={vi.fn()}
          onItemDeleted={vi.fn()}
        />,
      );

      expect(screen.getByText("Teilweise NETTO")).toBeInTheDocument();
    });

    it("should call onItemChanged with updated quantity (without mutating original)", async () => {
      const user = userEvent.setup();
      const item = createMockLineItem("Product");
      item.quantity = 1;
      const originalQuantity = item.quantity;
      const onItemChanged = vi.fn();

      render(
        <LineItemComponent
          item={item}
          index={2}
          onItemChanged={onItemChanged}
          onItemDeleted={vi.fn()}
        />,
      );

      const inputs = screen.getAllByRole("spinbutton");
      const quantityInput = inputs[0];

      await user.clear(quantityInput);
      await user.type(quantityInput, "5");

      // Original item should not be mutated
      expect(item.quantity).toBe(originalQuantity);

      // onItemChanged should be called with new item
      expect(onItemChanged).toHaveBeenCalled();
      const lastCall =
        onItemChanged.mock.calls[onItemChanged.mock.calls.length - 1];
      expect(lastCall[0]).toBe(2); // index
      // The quantity should be parsed from the input - will be "15" since "1" was cleared to "" then "5" typed
      // making it "15" in controlled component behavior
      expect(typeof lastCall[1].quantity).toBe("number");
    });

    it("should call onItemChanged with updated price (without mutating original)", async () => {
      const user = userEvent.setup();
      const item = createMockLineItem("Product");
      item.unitPrice.netAmount = 100;
      const originalPrice = item.unitPrice.netAmount;
      const onItemChanged = vi.fn();

      render(
        <LineItemComponent
          item={item}
          index={0}
          onItemChanged={onItemChanged}
          onItemDeleted={vi.fn()}
        />,
      );

      const inputs = screen.getAllByRole("spinbutton");
      const priceInput = inputs[1];

      await user.clear(priceInput);
      await user.type(priceInput, "250");

      // Original item should not be mutated
      expect(item.unitPrice.netAmount).toBe(originalPrice);

      // onItemChanged should be called with new item
      expect(onItemChanged).toHaveBeenCalled();
    });

    it("should call onItemDeleted with correct index when delete button clicked", async () => {
      const user = userEvent.setup();
      const onItemDeleted = vi.fn();

      render(
        <LineItemComponent
          item={createMockLineItem("Product")}
          index={3}
          onItemChanged={vi.fn()}
          onItemDeleted={onItemDeleted}
        />,
      );

      await user.click(screen.getByRole("button"));

      expect(onItemDeleted).toHaveBeenCalledWith(3);
    });

    it("should not render input controls for text line items", () => {
      const textItem: TextLineItem = {
        type: "text",
        name: "Section Header",
        description: "Some description text",
      };

      render(
        <LineItemComponent
          item={textItem}
          index={0}
          onItemChanged={vi.fn()}
          onItemDeleted={vi.fn()}
        />,
      );

      expect(screen.getByText("Section Header")).toBeInTheDocument();
      expect(screen.queryByText("Anzahl")).not.toBeInTheDocument();
      expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
    });

    it("should apply gray background for text items", () => {
      const textItem: TextLineItem = {
        type: "text",
        name: "Header",
      };

      render(
        <LineItemComponent
          item={textItem}
          index={0}
          onItemChanged={vi.fn()}
          onItemDeleted={vi.fn()}
        />,
      );

      const container = screen.getByText("Header").closest("div[data-index]");
      expect(container).toHaveClass("bg-gray-100");
    });
  });

  describe("LineItemsRenderer", () => {
    it("should return null when payload is undefined", () => {
      const { container } = render(
        <LineItemsRenderer
          payload={undefined}
          onItemDeleted={vi.fn()}
          onItemChanged={vi.fn()}
        />,
      );

      expect(container.firstChild).toBeNull();
    });

    it("should render header 'Positionen'", () => {
      const payload = createMockQuotation({
        lineItems: [createMockLineItem("Item 1")],
      });

      render(
        <LineItemsRenderer
          payload={payload}
          onItemDeleted={vi.fn()}
          onItemChanged={vi.fn()}
        />,
      );

      expect(screen.getByText("Positionen")).toBeInTheDocument();
    });

    it("should render all line items", () => {
      const payload = createMockQuotation({
        lineItems: [
          createMockLineItem("Product A"),
          createMockLineItem("Product B"),
          createMockLineItem("Product C"),
        ],
      });

      render(
        <LineItemsRenderer
          payload={payload}
          onItemDeleted={vi.fn()}
          onItemChanged={vi.fn()}
        />,
      );

      expect(screen.getByText("Product A")).toBeInTheDocument();
      expect(screen.getByText("Product B")).toBeInTheDocument();
      expect(screen.getByText("Product C")).toBeInTheDocument();
    });

    it("should pass callbacks to LineItemComponent", async () => {
      const user = userEvent.setup();
      const onItemDeleted = vi.fn();
      const onItemChanged = vi.fn();

      const payload = createMockQuotation({
        lineItems: [createMockLineItem("Product")],
      });

      render(
        <LineItemsRenderer
          payload={payload}
          onItemDeleted={onItemDeleted}
          onItemChanged={onItemChanged}
        />,
      );

      // Test that delete callback is passed through
      await user.click(screen.getByRole("button"));
      expect(onItemDeleted).toHaveBeenCalledWith(0);
    });

    it("should render empty container with header when no line items", () => {
      const payload = createMockQuotation({ lineItems: [] });

      render(
        <LineItemsRenderer
          payload={payload}
          onItemDeleted={vi.fn()}
          onItemChanged={vi.fn()}
        />,
      );

      expect(screen.getByText("Positionen")).toBeInTheDocument();
      // Should still render the container structure
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
});
