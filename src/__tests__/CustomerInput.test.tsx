import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../api";
import { CustomerInput } from "../components/form/CustomerInput";

// Mock the api module
vi.mock("../api", () => ({
  getContacts: vi.fn(),
}));

describe("CustomerInput", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("apiKey", "test-api-key");
  });

  it("should render with placeholder", () => {
    render(<CustomerInput onChange={mockOnChange} />);

    expect(screen.getByPlaceholderText("Testkunde")).toBeInTheDocument();
  });

  it("should render the label", () => {
    render(<CustomerInput onChange={mockOnChange} />);

    expect(screen.getByText("Kunde")).toBeInTheDocument();
  });

  it("should not search with less than 3 characters", async () => {
    const user = userEvent.setup();
    render(<CustomerInput onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText("Testkunde");
    await user.type(input, "ab");

    // Wait a bit to ensure no call was made
    await new Promise((r) => setTimeout(r, 100));
    expect(api.getContacts).not.toHaveBeenCalled();
  });

  it("should search when typing 3+ characters", async () => {
    vi.mocked(api.getContacts).mockResolvedValue([
      {
        contactId: "test-id",
        name: "Testfirma GmbH",
        street: "Hauptstr. 5",
        city: "Musterort",
        zip: "12345",
        countryCode: "DE",
      },
    ]);

    const user = userEvent.setup();
    render(<CustomerInput onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText("Testkunde");
    await user.type(input, "Test");

    await waitFor(() => {
      expect(api.getContacts).toHaveBeenCalled();
    });
  });

  it("should display search results", async () => {
    vi.mocked(api.getContacts).mockResolvedValue([
      {
        contactId: "test-id",
        name: "Testfirma GmbH",
        street: "Hauptstr. 5",
        city: "Musterort",
        zip: "12345",
        countryCode: "DE",
      },
    ]);

    const user = userEvent.setup();
    render(<CustomerInput onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText("Testkunde");
    await user.type(input, "Testfirma");

    await waitFor(() => {
      expect(screen.getByText("Testfirma GmbH")).toBeInTheDocument();
    });
  });

  it("should display customer address in results", async () => {
    vi.mocked(api.getContacts).mockResolvedValue([
      {
        contactId: "test-id",
        name: "Test AG",
        street: "Teststraße 10",
        city: "Berlin",
        zip: "10115",
        countryCode: "DE",
      },
    ]);

    const user = userEvent.setup();
    render(<CustomerInput onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText("Testkunde");
    await user.type(input, "Test");

    await waitFor(() => {
      expect(screen.getByText("Test AG")).toBeInTheDocument();
      expect(screen.getByText("10115 Berlin")).toBeInTheDocument();
    });
  });

  it("should call onChange when customer is selected", async () => {
    const mockCustomer = {
      contactId: "test-id",
      name: "Testfirma GmbH",
      street: "Hauptstr. 5",
      city: "Musterort",
      zip: "12345",
      countryCode: "DE",
    };
    vi.mocked(api.getContacts).mockResolvedValue([mockCustomer]);

    const user = userEvent.setup();
    render(<CustomerInput onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText("Testkunde");
    await user.type(input, "Testfirma");

    await waitFor(() => {
      expect(screen.getByText("Testfirma GmbH")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Testfirma GmbH"));

    expect(mockOnChange).toHaveBeenCalledWith(mockCustomer);
  });

  it("should use API key from localStorage", async () => {
    localStorage.setItem("apiKey", "my-custom-api-key");
    vi.mocked(api.getContacts).mockResolvedValue([]);

    const user = userEvent.setup();
    render(<CustomerInput onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText("Testkunde");
    await user.type(input, "Test");

    await waitFor(() => {
      expect(api.getContacts).toHaveBeenCalledWith(
        "my-custom-api-key",
        expect.any(String),
      );
    });
  });

  it("should handle empty results gracefully", async () => {
    vi.mocked(api.getContacts).mockResolvedValue([]);

    const user = userEvent.setup();
    render(<CustomerInput onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText("Testkunde");
    await user.type(input, "NonExistent");

    // Should not crash, input should still work
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("NonExistent");
  });

  it("should handle API errors gracefully", async () => {
    // Suppress console.error for this test since we expect an unhandled error
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(api.getContacts).mockRejectedValue(new Error("API Error"));

    const user = userEvent.setup();
    render(<CustomerInput onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText("Testkunde");
    await user.type(input, "Test");

    // Component should not crash, give time for error to be processed
    await waitFor(() => {
      expect(input).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });
});
