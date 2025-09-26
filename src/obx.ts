import type {
  Address,
  CustomLineItem,
  LineItem,
  Quotation,
  SubLineItem,
  TextLineItem,
} from "./types";

let evaluator: XPathEvaluator;
let multiplier: number;

function iterate(xpathResult: XPathResult): Node[] {
  const array: Node[] = [];
  let node = xpathResult.iterateNext();
  while (node) {
    array.push(node);
    node = xpathResult.iterateNext();
  }
  return array;
}

function money(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
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

function getNumber(xpath: string, context: Node): number {
  const str = getString(xpath, context) ?? "0";
  return money(parseFloat(str.replace(",", ".")));
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
  parent: string,
  includeDescription = true,
): TextLineItem[] {
  const subItems = [
    parent,
    ...aggregateDuplicates(
      get(`.//bskArticle`, context).map(
        (node): SubLineItem => ({
          name: `${getString(
            `./description[@type='short']/text[@lang='de']`,
            node,
          )} | ${getString(`./artNr[@type='final']`, node)}`,
          unitPrice: {
            netAmount: getNumber(
              `./itemPrice[@type='sale'][@pd='1']/@value`,
              node,
            ),
          },
          description:
            getString(
              `./description[@type='features']/text[@lang='de']`,
              node,
            ) || "",
          quantity: 1,
        }),
      ),
    ).map((item) =>
      item.unitPrice?.netAmount
        ? `${item.quantity}x ${item.name} | je ${(
            item.unitPrice.netAmount * multiplier
          ).toFixed(2)} EUR${
            includeDescription ? `\n${item.description}\n` : ""
          }`
        : `${item.quantity}x ${item.name}`,
    ),
  ];

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

  return subItems.length > 1
    ? [
        {
          type: "text",
          name: "Bestehend aus:",
          description: subItems.join("\n").trim(),
        },
      ]
    : [];
}

function createLineItem(
  context: Node,
  prefix: string,
  includeDescription = true,
): [CustomLineItem, ...Array<TextLineItem>] {
  const name =
    getString("./artNr[@type='final']", context) +
    " | " +
    getString("./description[@type='short']/text[@lang='de']", context);
  const price =
    getNumber("./itemPrice[@type='sale'][@pd='1']/@value", context) *
    multiplier;
  const currency =
    getString("./itemPrice[@type='sale'][@pd='1']/@currency", context) ?? "EUR";
  const subItems = createSubItems(
    context,
    `1x ${name} | je ${price.toFixed(2)} ${currency}\n`,
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
            get(
              `.//bskArticle/itemPrice[@type='sale'][@pd='1']/@value`,
              context,
            ).reduce(
              (sum, curr) =>
                sum + parseFloat(curr?.textContent ?? "0") * multiplier,
              0,
            ),
        ),
        taxRatePercentage: 19,
      },
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
        if (item?.[0].quantity) {
          if (item.length < 2 || item[1].description === curr[1].description) {
            item[0].quantity += 1;
          }
        } else {
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

export function createPayload(
  parsed: Document | Record<string, Document>,
  multiplierValue: number,
  includeDescription: boolean,
  groupLineItems: boolean,
  address: Address = { name: "Testkunde", countryCode: "DE" },
  xpath: XPathEvaluator = new XPathEvaluator(),
): Quotation {
  evaluator = xpath;
  multiplier = Number.isNaN(multiplierValue) ? 1 : multiplierValue;

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
        name: `Es folgen die Artikel für ${roomName}`,
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
        name: `Nettosumme ${roomName}: ${roomTotal.toLocaleString("de-DE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} EUR`,
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
