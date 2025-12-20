import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { extractNonDiscountedArtNrs } from "../utils/xlsxParser";

describe("xlsxParser", () => {
  describe("extractNonDiscountedArtNrs", () => {
    it("should extract article numbers with 'Netto' in column C from real Excel file", () => {
      // Read the example Excel file
      const filePath = join(
        __dirname,
        "../../examples/Preisliste EXPLORIS 2024_DE_1.xlsx",
      );
      const fileBuffer = readFileSync(filePath);
      const buffer = fileBuffer.buffer.slice(
        fileBuffer.byteOffset,
        fileBuffer.byteOffset + fileBuffer.byteLength,
      );

      const result = extractNonDiscountedArtNrs(buffer);

      // Should return an array of article numbers
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // All results should be trimmed strings
      for (const artNr of result) {
        expect(typeof artNr).toBe("string");
        expect(artNr).toBe(artNr.trim());
      }
    });

    it("should return empty array for empty/invalid Excel data", () => {
      // XLSX.read with empty buffer returns an empty workbook, not an error
      // The function should handle this gracefully and return empty array
      const result = extractNonDiscountedArtNrs(new ArrayBuffer(0));
      expect(result).toEqual([]);
    });

    it("should return empty array when no rows match the Netto criteria", () => {
      // Create a simple XLSX with no matching rows using xlsx library
      const XLSX = require("xlsx");
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([
        ["ART-001", "Description", "Brutto"], // No "Netto"
        ["ART-002", "Another", "Regular"],
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const buffer = XLSX.write(workbook, { type: "array" });

      const result = extractNonDiscountedArtNrs(buffer);

      expect(result).toEqual([]);
    });

    it("should extract article numbers case-insensitively for 'Netto'", () => {
      const XLSX = require("xlsx");
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([
        ["ART-001", "Description", "NETTO"], // uppercase
        ["ART-002", "Another", "netto"], // lowercase
        ["ART-003", "Third", "Netto Preis"], // contains netto
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const buffer = XLSX.write(workbook, { type: "array" });

      const result = extractNonDiscountedArtNrs(buffer);

      expect(result).toHaveLength(3);
      expect(result).toContain("ART-001");
      expect(result).toContain("ART-002");
      expect(result).toContain("ART-003");
    });

    it("should skip rows where column A is not a string", () => {
      const XLSX = require("xlsx");
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([
        [12345, "Description", "Netto"], // Number in column A
        ["ART-001", "Valid", "Netto"],
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const buffer = XLSX.write(workbook, { type: "array" });

      const result = extractNonDiscountedArtNrs(buffer);

      expect(result).toHaveLength(1);
      expect(result).toContain("ART-001");
    });

    it("should trim article numbers", () => {
      const XLSX = require("xlsx");
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet([
        ["  ART-001  ", "Description", "Netto"],
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
      const buffer = XLSX.write(workbook, { type: "array" });

      const result = extractNonDiscountedArtNrs(buffer);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe("ART-001");
    });
  });
});
