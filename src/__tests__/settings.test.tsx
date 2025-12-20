import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiKeyInput } from "../components/form/ApiKeyInput";
import { DescriptionToggle } from "../components/form/DescriptionToggle";
import { GroupingToggle } from "../components/form/GroupingToggle";
import { SettingsModal } from "../components/SettingsModal";

describe("Settings Components", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("ApiKeyInput", () => {
    it("should render with empty value when localStorage is empty", () => {
      const onChange = vi.fn();
      render(<ApiKeyInput onChange={onChange} />);

      // Password inputs don't have textbox role, find by password type
      const passwordInput = document.querySelector(
        'input[type="password"]',
      ) as HTMLInputElement;

      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput.value).toBe("");
    });

    it("should load initial value from localStorage", () => {
      localStorage.setItem("apiKey", "stored-api-key-123");
      const onChange = vi.fn();

      render(<ApiKeyInput onChange={onChange} />);

      const passwordInput = document.querySelector(
        'input[type="password"]',
      ) as HTMLInputElement;
      expect(passwordInput.value).toBe("stored-api-key-123");
    });

    it("should call onChange and persist to localStorage on input change", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<ApiKeyInput onChange={onChange} />);

      const passwordInput = document.querySelector(
        'input[type="password"]',
      ) as HTMLInputElement;
      await user.clear(passwordInput);
      await user.type(passwordInput, "new-key");

      expect(localStorage.getItem("apiKey")).toBe("new-key");
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe("GroupingToggle", () => {
    it("should render with 'grouped' option selected when value is true", () => {
      const onChange = vi.fn();
      render(<GroupingToggle value={true} onChange={onChange} />);

      const select = screen.getByRole("combobox");
      expect(select).toHaveValue("y");
    });

    it("should render with 'individual' option selected when value is false", () => {
      const onChange = vi.fn();
      render(<GroupingToggle value={false} onChange={onChange} />);

      const select = screen.getByRole("combobox");
      expect(select).toHaveValue("n");
    });

    it("should call onChange with correct boolean when selection changes", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<GroupingToggle value={true} onChange={onChange} />);

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "n");

      expect(onChange).toHaveBeenCalledWith(false);
    });
  });

  describe("DescriptionToggle", () => {
    it("should render with 'long' option selected when value is true", () => {
      const onChange = vi.fn();
      render(<DescriptionToggle value={true} onChange={onChange} />);

      const select = screen.getByRole("combobox");
      expect(select).toHaveValue("long");
    });

    it("should render with 'short' option selected when value is false", () => {
      const onChange = vi.fn();
      render(<DescriptionToggle value={false} onChange={onChange} />);

      const select = screen.getByRole("combobox");
      expect(select).toHaveValue("short");
    });

    it("should call onChange with correct boolean when selection changes", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<DescriptionToggle value={false} onChange={onChange} />);

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "long");

      expect(onChange).toHaveBeenCalledWith(true);
    });
  });

  describe("SettingsModal", () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      onApiKeyChange: vi.fn(),
      grouping: true,
      onGroupingChange: vi.fn(),
      description: true,
      onDescriptionChange: vi.fn(),
      onNonDiscountedListChange: vi.fn(),
    };

    it("should not render when isOpen is false", async () => {
      render(<SettingsModal {...defaultProps} isOpen={false} />);

      await waitFor(() => {
        expect(screen.queryByText("Einstellungen")).not.toBeInTheDocument();
      });
    });

    it("should render dialog when isOpen is true", async () => {
      render(<SettingsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Einstellungen")).toBeInTheDocument();
      });
    });

    it("should render ApiKeyInput component", async () => {
      render(<SettingsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("API Key")).toBeInTheDocument();
        expect(
          document.querySelector('input[type="password"]'),
        ).toBeInTheDocument();
      });
    });

    it("should render GroupingToggle component", async () => {
      render(<SettingsModal {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText("Darstellung gleicher Produkte"),
        ).toBeInTheDocument();
      });
    });

    it("should render DescriptionToggle component", async () => {
      render(<SettingsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Beschreibungen")).toBeInTheDocument();
      });
    });

    it("should render file input for Excel price list", async () => {
      render(<SettingsModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText("Preisliste (Excel):")).toBeInTheDocument();
        expect(
          document.querySelector('input[type="file"]'),
        ).toBeInTheDocument();
      });
    });

    it("should show previously loaded filename from localStorage", async () => {
      localStorage.setItem("nonDiscountedFileName", "TestPreisliste.xlsx");

      render(<SettingsModal {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText("Aktuell geladen: TestPreisliste.xlsx"),
        ).toBeInTheDocument();
      });
    });

    it("should call onClose when close button is clicked", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<SettingsModal {...defaultProps} onClose={onClose} />);

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /schließen/i }),
        ).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: /schließen/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it("should render grouping select with correct default value", async () => {
      render(<SettingsModal {...defaultProps} grouping={false} />);

      await waitFor(() => {
        // Find the grouping-related select (should have 'n' value when grouping is false)
        const selects = screen.getAllByRole("combobox");
        const groupingSelect = selects.find(
          (select) => (select as HTMLSelectElement).value === "n",
        );
        expect(groupingSelect).toBeTruthy();
      });
    });
  });
});
