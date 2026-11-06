import * as XLSX from "xlsx";

export interface PriceListData {
  nonDiscountedArtNrs: string[];
  prices: Record<string, number>;
}

function parsePrice(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const str = value.trim();
    // German format "1.234,56": dots are thousands separators
    const parsed = Number(
      str.includes(",") ? str.replace(/\./g, "").replace(",", ".") : str,
    );
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function parsePriceList(data: ArrayBuffer | Uint8Array): PriceListData {
  const workbook = XLSX.read(data);
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1 });

  const nonDiscountedArtNrs: string[] = [];
  const prices: Record<string, number> = {};
  for (const row of rows) {
    const artNr = row[0];
    if (!artNr || typeof artNr !== "string") {
      continue;
    }

    const listPrice = parsePrice(row[1]);
    if (listPrice !== null) {
      prices[artNr.trim()] = listPrice;
    }

    const discountGroup = row[2];
    if (
      typeof discountGroup === "string" &&
      discountGroup.toLowerCase().includes("netto")
    ) {
      nonDiscountedArtNrs.push(artNr.trim());
    }
  }

  return { nonDiscountedArtNrs, prices };
}
