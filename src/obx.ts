import type {
  Address,
  CustomLineItem,
  LineItem,
  Quotation,
  SubLineItem,
  TextLineItem,
} from "./types";
import { money } from "./util.ts";

// Articles whose artNr[@type='final'] is a planning keyword instead of an
// article number (e.g. "TEILPLANNUNG_TP | Planungshilfe Tischplatten"), mapped
// to the name that should be shown to the customer.
const planningHelpers = new Map([
  ["TEILPLANNUNG_TP", "Tischplatte individuell"],
]);

let evaluator: XPathEvaluator;
let multiplier: number;
let nonDiscountedArtNrs: Set<string>;
let priceList: Map<string, number>;
let priceSource: PriceSource;

export type PriceSource = "obx" | "priceList";

export interface PriceMismatch {
  artNr: string;
  name: string;
  /** Price from the obx file, `null` when the file contains no valid price. */
  obxPrice: number | null;
  listPrice: number;
}

function iterate(xpathResult: XPathResult): Node[] {
  const array: Node[] = [];
  let node = xpathResult.iterateNext();
  while (node) {
    array.push(node);
    node = xpathResult.iterateNext();
  }
  return array;
}

function get(xpath: string, context: Node): Node[] {
  return iterate(
    evaluator.evaluate(xpath, context, null, 0 /* XPathResult.ANY_TYPE */),
  );
}

function getString(xpath: string, context: Node): string | undefined {
  const content = get(xpath, context)[0]?.textContent;
  return content?.replace(/\t/g, "").trim();
}

function getObxPrice(node: Node): number | null {
  const str = getString("./itemPrice[@type='sale'][@pd='1']/@value", node);
  if (str === undefined || str === "") {
    return null;
  }
  const value = parseFloat(str.replace(",", "."));
  return Number.isFinite(value) ? money(value) : null;
}

function getItemPrice(node: Node): number {
  const artNr = getString("./artNr[@type='final']", node);
  const listPrice =
    priceSource === "priceList" && artNr ? priceList.get(artNr) : undefined;
  return listPrice ?? getObxPrice(node) ?? 0;
}

function getPos(room: Node): [string, Node][] {
  return get("./setArticle", room).map((pos) => [
    `${getString("./label[@lang='de']", room)} | ${getString(
      "./description[@default='1']/text[@lang='de']",
      pos,
    )}\n`,
    pos,
  ]);
}

function getPrefix(parsed: Document): [string, Node][] {
  const rooms = get("/cutBuffer/items/bskFolder", parsed);

  if (rooms.length) {
    return rooms.length === 1
      ? getPos(rooms[0])
      : rooms.flatMap((room) => getPos(room));
  }
  return [["", get("/cutBuffer/items", parsed)[0]]];
}

function createSubItems(
  context: Node,
  parent: string | undefined,
  includeDescription = true,
): TextLineItem[] {
  const children = aggregateDuplicates(
    get(`.//bskArticle`, context).map(
      (node): SubLineItem => ({
        name: `${getString(
          `./description[@type='short']/text[@lang='de']`,
          node,
        )} | ${getString(`./artNr[@type='final']`, node)}`,
        unitPrice: {
          netAmount: getItemPrice(node),
        },
        description:
          getString(`./description[@type='features']/text[@lang='de']`, node) ||
          "",
        quantity: 1,
      }),
    ),
  ).map((item) =>
    item.unitPrice?.netAmount
      ? `${item.quantity}x ${item.name} | je ${(
          item.unitPrice.netAmount * multiplier
        ).toFixed(2)} EUR${includeDescription ? `\n${item.description}\n` : ""}`
      : `${item.quantity}x ${item.name}`,
  );

  if (children.length === 0) {
    return [];
  }

  // Planning helpers are listed without their own line, only their children.
  const subItems = parent ? [parent, ...children] : children;

  if (subItems.join("\n").length >= 2000) {
    const divisor = Math.ceil(subItems.join("\n").length / 2000);
    const step = Math.ceil(subItems.length / divisor);
    const list = [] as TextLineItem[];
    for (let i = 0; i < subItems.length; i += step) {
      list.push({
        type: "text",
        name: `Bestehend aus${i > 0 ? " (Fortsetzung):" : ":"}`,
        description: subItems
          .slice(i, i + step)
          .join("\n")
          .trim(),
      });
    }
    return list;
  }

  return [
    {
      type: "text",
      name: "Bestehend aus:",
      description: subItems.join("\n").trim(),
    },
  ];
}

function createLineItem(
  context: Node,
  prefix: string,
  includeDescription = true,
): [CustomLineItem, ...Array<TextLineItem>] {
  const artNr = getString("./artNr[@type='final']", context) ?? "";
  // Planning helpers carry a keyword instead of a real article number. They are
  // only a container for their children, so they get a readable name and are
  // left out of the "Bestehend aus" summary.
  const planningHelperName = planningHelpers.get(artNr.toUpperCase());
  const name =
    planningHelperName ??
    artNr +
      " | " +
      getString("./description[@type='short']/text[@lang='de']", context);
  const price = getItemPrice(context) * multiplier;
  const currency =
    getString("./itemPrice[@type='sale'][@pd='1']/@currency", context) ?? "EUR";

  // Check if main item or any sub-items are non-discounted
  const isMainNonDiscounted = nonDiscountedArtNrs.has(artNr);
  const subArticleNodes = get(`.//bskArticle`, context);
  const hasNonDiscountedSubs = subArticleNodes.some((node) => {
    const subArtNr = getString(`./artNr[@type='final']`, node);
    return subArtNr && nonDiscountedArtNrs.has(subArtNr);
  });

  const subItems = createSubItems(
    context,
    planningHelperName
      ? undefined
      : `1x ${name} | je ${price.toFixed(2)} ${currency}\n`,
    includeDescription,
  );
  return [
    {
      type: "custom",
      name: name,
      description:
        prefix +
        (getString(
          "./description[@type='features']/text[@lang='de']",
          context,
        ) ??
          getString("./description[@type='long']/text[@lang='de']", context)) +
        (!includeDescription && subItems.length
          ? `\n\n${subItems[0].name}\n${subItems[0].description}`
          : ""),
      quantity: 1,
      unitName: "Stk.",
      unitPrice: {
        currency: currency,
        netAmount: money(
          price +
            subArticleNodes.reduce(
              (sum, node) => sum + getItemPrice(node) * multiplier,
              0,
            ),
        ),
        taxRatePercentage: 19,
      },
      artNr: artNr,
      isNonDiscounted: isMainNonDiscounted,
      hasNonDiscountedSubItems: hasNonDiscountedSubs && !isMainNonDiscounted,
    },
    ...(includeDescription ? subItems : []),
  ];
}

function aggregateDuplicates<T extends CustomLineItem | SubLineItem>(
  lineItems: T[],
): T[] {
  return lineItems.reduce((items, curr) => {
    const item = items.find(
      (item) =>
        item.name === curr.name &&
        item.unitPrice?.netAmount === curr.unitPrice?.netAmount,
    );
    if (item?.quantity) {
      item.quantity += 1;
    } else {
      items.push(curr);
    }
    return items;
  }, [] as T[]);
}

function aggregateDuplicateLists(
  lineItems: [CustomLineItem, ...Array<TextLineItem>][],
  groupLineItems: boolean,
): LineItem[] {
  if (!groupLineItems) {
    return lineItems.flat();
  }
  return lineItems
    .reduce(
      (items, curr) => {
        const item = items.find(
          (item) =>
            item[0].name === curr[0].name &&
            item[0].unitPrice?.netAmount === curr[0].unitPrice?.netAmount,
        );
        if (!item) {
          items.push(curr);
          return items;
        }

        const hasMatchingDescriptions =
          item.length < 2 ||
          curr.length < 2 ||
          item[1].description === curr[1].description;

        if (hasMatchingDescriptions) {
          item[0].quantity += curr[0].quantity;
        } else {
          // Same article/price but different composition details:
          // keep as separate line item instead of dropping it.
          items.push(curr);
        }

        return items;
      },
      [] as [CustomLineItem, ...Array<TextLineItem>][],
    )
    .flat();
}

function getShippingCosts(volumes: number[], weights: number[]): LineItem {
  const disclaimer = `Warenlieferungen erfolgen DDP (Delivered Duty Paid). Die Anlieferung umfasst den Transport in den Aufstellungsraum bzw. wenn dies nicht möglich ist, hinter die erste verschlossene Tür.`;

  return {
    type: "custom",
    name: "Frachtkosten und Verbringung",
    description: `Volumen: ${volumes
      .filter((d) => d)
      .reduce((s, v) => s + v, 0)
      .toFixed(2)}m³\nGewicht: ${weights
      .filter((d) => d)
      .reduce((s, v) => s + v, 0)
      .toFixed(2)}kg\n\n${disclaimer}`,
    quantity: 1,
    unitName: "Psch",
    unitPrice: {
      currency: "EUR",
      netAmount: Math.max(
        Math.ceil(volumes.filter((d) => d).reduce((s, v) => s + v, 0)) * 140,
        200,
      ),
      taxRatePercentage: 19,
    },
  };
}

function getVolumes(parsed: Document) {
  return getPrefix(parsed).flatMap(([, root]) =>
    get("./bskArticle", root)
      .flatMap(
        (context) =>
          get(".//packInfo[@key='volume']/@value", context) ??
          get(".//feature[@name='VOLUMEN']/@value", context) ??
          get(".//feature[@name='Volumen']/@value", context),
      )
      .map((v) => parseFloat((v as Attr).value || "0")),
  );
}

function getWeights(parsed: Document) {
  return getPrefix(parsed).flatMap(([, root]) =>
    get("./bskArticle", root)
      .flatMap(
        (context) =>
          get(".//packInfo[@key='netWeight']/@originalValue", context) ??
          get(".//feature[@name='GEWICHT']/@value", context) ??
          get(".//feature[@name='Gewicht']/@value", context),
      )
      .map((v) => parseFloat((v as Attr).value || "0")),
  );
}

function processDocument(
  parsed: Document,
  includeDescription: boolean,
  groupLineItems: boolean,
): LineItem[] {
  return aggregateDuplicateLists(
    getPrefix(parsed).flatMap(([prefix, root]) =>
      get("./bskArticle", root).map((context) =>
        createLineItem(context, prefix, includeDescription),
      ),
    ),
    groupLineItems,
  );
}

function calculateRoomTotal(lineItems: LineItem[]): number {
  return lineItems.reduce((total, item) => {
    if (
      "type" in item &&
      item.type === "custom" &&
      "unitPrice" in item &&
      item.unitPrice
    ) {
      return total + item.unitPrice.netAmount * item.quantity;
    }
    return total;
  }, 0);
}

export function computeShippingInputs(
  parsed: Document | Record<string, Document>,
  xpath: XPathEvaluator = new XPathEvaluator(),
): { volumes: number[]; weights: number[] } {
  evaluator = xpath;
  if ("documentElement" in parsed) {
    const doc = parsed as Document;
    return { volumes: getVolumes(doc), weights: getWeights(doc) };
  }
  const docs = Object.values(parsed as Record<string, Document>);
  return {
    volumes: docs.flatMap(getVolumes),
    weights: docs.flatMap(getWeights),
  };
}

/**
 * Compares the prices of all articles (including sub-articles) in the given
 * documents against the price list. Articles missing from the price list are
 * ignored. Every article number is reported at most once.
 */
export function findPriceMismatches(
  parsed: Document | Record<string, Document>,
  priceListMap: Map<string, number>,
  xpath: XPathEvaluator = new XPathEvaluator(),
): PriceMismatch[] {
  evaluator = xpath;
  if (priceListMap.size === 0) {
    return [];
  }

  const docs =
    "documentElement" in parsed
      ? [parsed as Document]
      : Object.values(parsed as Record<string, Document>);
  const mismatches = new Map<string, PriceMismatch>();

  for (const doc of docs) {
    for (const node of get("//bskArticle", doc)) {
      const artNr = getString("./artNr[@type='final']", node);
      if (!artNr || mismatches.has(artNr)) {
        continue;
      }
      const listPrice = priceListMap.get(artNr);
      if (listPrice === undefined) {
        continue;
      }
      const obxPrice = getObxPrice(node);
      if (obxPrice !== null && Math.abs(obxPrice - listPrice) < 0.005) {
        continue;
      }
      mismatches.set(artNr, {
        artNr,
        name:
          getString("./description[@type='short']/text[@lang='de']", node) ??
          "",
        obxPrice,
        listPrice,
      });
    }
  }

  return [...mismatches.values()];
}

export function createPayload(
  parsed: Document | Record<string, Document>,
  multiplierValue: number,
  includeDescription: boolean,
  groupLineItems: boolean,
  address: Address = { name: "Testkunde", countryCode: "DE" },
  xpath: XPathEvaluator = new XPathEvaluator(),
  nonDiscountedSet: Set<string> = new Set(),
  priceListMap: Map<string, number> = new Map(),
  priceSourceValue: PriceSource = "obx",
): Quotation {
  evaluator = xpath;
  multiplier = Number.isNaN(multiplierValue) ? 1 : multiplierValue;
  nonDiscountedArtNrs = nonDiscountedSet;
  priceList = priceListMap;
  priceSource = priceSourceValue;

  const now = new Date();
  const expiration = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 14,
  );

  let allLineItems: LineItem[] = [];

  if (typeof parsed === "object" && "documentElement" in parsed) {
    const document = parsed as Document;
    allLineItems = [
      ...processDocument(document, includeDescription, groupLineItems),
      getShippingCosts(getVolumes(document), getWeights(document)),
    ];
  } else {
    const multipleDocuments = parsed;
    const roomEntries = Object.entries(multipleDocuments);
    const allDocuments: Document[] = [];

    for (const [roomName, document] of roomEntries) {
      allLineItems.push({
        type: "text",
        name: `Es folgen die Artikel für ${roomName.replace(".obx", "")}`,
      });

      const roomLineItems = processDocument(
        document,
        includeDescription,
        groupLineItems,
      );
      allLineItems.push(...roomLineItems);

      const roomTotal = calculateRoomTotal(roomLineItems);

      allLineItems.push({
        type: "text",
        name: `Nettosumme ${roomName.replace(".obx", "")}: ${roomTotal.toLocaleString(
          "de-DE",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        )} EUR`,
      });

      allDocuments.push(document);
    }

    const mergedShippingCosts = getShippingCosts(
      allDocuments.reduce((volumes, doc) => {
        volumes.push(...getVolumes(doc));
        return volumes;
      }, [] as number[]),
      allDocuments.reduce((weights, doc) => {
        weights.push(...getWeights(doc));
        return weights;
      }, [] as number[]),
    );
    allLineItems.push(mergedShippingCosts);
  }

  return {
    voucherDate: now.toISOString(),
    expirationDate: expiration.toISOString(),
    address: address ?? { name: "Testkunde", countryCode: "DE" },
    lineItems: allLineItems,
    totalPrice: { currency: "EUR" },
    taxConditions: { taxType: "net" },
  };
}
