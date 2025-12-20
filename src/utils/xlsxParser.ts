import * as XLSX from "xlsx";

/**
 * Extracts article numbers that should not receive discounts from an Excel file.
 * Looks for rows where column A contains an article number and column C contains "Netto" (case-insensitive).
 *
 * @param buffer - ArrayBuffer containing the Excel file contents
 * @returns Array of article number strings that are marked as non-discounted
 */
export function extractNonDiscountedArtNrs(buffer: ArrayBuffer): string[] {
  const workbook = XLSX.read(buffer);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1 });

  const nonDiscountedArtNrs: string[] = [];
  for (const row of data) {
    const artNr = row[0]; // Column A (index 0)
    const columnC = row[2]; // Column C (index 2)

    if (
      artNr &&
      typeof artNr === "string" &&
      columnC &&
      typeof columnC === "string" &&
      columnC.toLowerCase().includes("netto")
    ) {
      nonDiscountedArtNrs.push(artNr.trim());
    }
  }

  return nonDiscountedArtNrs;
}
