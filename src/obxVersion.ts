export const defaultSafeBskXmlVersion = "1.8.11";

export interface UnsafeObxVersion {
  filename: string;
  version: string;
}

export function compareVersions(a: string, b: string): number {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (left[i] || 0) - (right[i] || 0);
    if (diff !== 0) {
      return Math.sign(diff);
    }
  }
  return 0;
}

export function getBskXmlVersion(
  doc: Document,
  xpath: XPathEvaluator = new XPathEvaluator(),
): string | undefined {
  const node = xpath
    .evaluate(
      "(//@bskXmlVersion | //bskXmlVersion)",
      doc,
      null,
      0 /* XPathResult.ANY_TYPE */,
    )
    .iterateNext();
  return node?.textContent?.trim() || undefined;
}

export function findUnsafeObxVersions(
  docs: Record<string, Document>,
  safeVersion: string,
  xpath?: XPathEvaluator,
): UnsafeObxVersion[] {
  return Object.entries(docs).flatMap(([filename, doc]) => {
    const version = getBskXmlVersion(doc, xpath);
    return version && compareVersions(version, safeVersion) > 0
      ? [{ filename, version }]
      : [];
  });
}

export function highestVersion(versions: string[]): string {
  return versions.reduce((max, v) => (compareVersions(v, max) > 0 ? v : max));
}
