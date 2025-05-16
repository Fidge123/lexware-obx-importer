let evaluator: XPathEvaluator;
let mult: number;

interface LineItem {
  type: string;
  name: string;
  description: string;
  quantity?: number;
  unitName?: string;
  unitPrice?: {
    currency: string;
    netAmount: number;
    taxRatePercentage: number;
  };
}

function iterate(xpathResult: XPathResult): Node[] {
  const array: Node[] = [];
  let node: Node | null;
  while ((node = xpathResult.iterateNext())) {
    array.push(node);
  }
  return array;
}

function money(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

function get(xpath: string, context: Node): Node[] {
  return iterate(
    evaluator.evaluate(xpath, context, null, 0 /* XPathResult.ANY_TYPE */)
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
      pos
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
  includeDescription = true
): LineItem[] {
  const subItems = [
    parent,
    ...aggregateDuplicates(
      get(`.//bskArticle`, context).map(
        (node): LineItem => ({
          type: "text",
          name: `${getString(
            `./description[@type='short']/text[@lang='de']`,
            node
          )} | ${getString(`./artNr[@type='final']`, node)}`,
          unitPrice: {
            currency: "EUR",
            netAmount: getNumber(
              `./itemPrice[@type='sale'][@pd='1']/@value`,
              node
            ),
            taxRatePercentage: 19,
          },
          description:
            getString(
              `./description[@type='features']/text[@lang='de']`,
              node
            ) || "",
          quantity: 1,
        })
      )
    ).map((item) =>
      item.unitPrice?.netAmount
        ? `${item.quantity}x ${item.name} | je ${(
            (item.unitPrice.netAmount * mult) /
            (item.quantity ?? 1)
          ).toFixed(2)} EUR${
            includeDescription ? `\n${item.description}\n` : ""
          }`
        : `${item.quantity}x ${item.name}`
    ),
  ];

  if (subItems.join("\n").length >= 2000) {
    const divisor = Math.ceil(subItems.join("\n").length / 2000);
    const step = Math.ceil(subItems.length / divisor);
    const list: LineItem[] = [];
    for (let i = 0; i < subItems.length; i += step) {
      list.push({
        type: "text",
        name: `Bestehend aus${i > 0 ? " (Fortsetzung):" : ":"}`,
        description: subItems.slice(i, i + step).join("\n"),
      });
    }
    return list;
  }

  return subItems.length > 1
    ? [
        {
          type: "text",
          name: "Bestehend aus:",
          description: subItems.join("\n"),
        },
      ]
    : [];
}

function createLineItem(
  context: Node,
  prefix: string,
  includeDescription = true
): LineItem[] {
  const name =
    getString("./artNr[@type='final']", context) +
    " | " +
    getString("./description[@type='short']/text[@lang='de']", context);
  const price =
    getNumber("./itemPrice[@type='sale'][@pd='1']/@value", context) * mult;
  const currency =
    getString("./itemPrice[@type='sale'][@pd='1']/@currency", context) ?? "EUR";
  const subItems = createSubItems(
    context,
    `1x ${name} | je ${price.toFixed(2)} ${currency}\n`,
    includeDescription
  );
  return [
    {
      type: "custom",
      name: name,
      description:
        prefix +
        (getString(
          "./description[@type='features']/text[@lang='de']",
          context
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
              context
            ).reduce(
              (sum, curr) => sum + parseFloat(curr?.textContent ?? "0") * mult,
              0
            )
        ),
        taxRatePercentage: 19,
      },
    },
    ...(includeDescription ? subItems : []),
  ];
}

function aggregateDuplicates(lineItems: LineItem[]): LineItem[] {
  return lineItems.reduce<LineItem[]>((items, curr) => {
    const item = items.find(
      (item) =>
        item.name === curr.name &&
        item.unitPrice?.netAmount === curr.unitPrice?.netAmount
    );
    if (item && item.quantity) {
      item.quantity += 1;
    } else {
      items.push(curr);
    }
    return items;
  }, []);
}

function getShippingCosts(parsed: Document): LineItem {
  const volumes = getPrefix(parsed).flatMap(([, root]) =>
    get("./bskArticle", root)
      .flatMap(
        (context) =>
          get(".//packInfo[@key='volume']/@value", context) ??
          get(".//feature[@name='VOLUMEN']/@value", context) ??
          get(".//feature[@name='Volumen']/@value", context)
      )
      .map((v) => parseFloat((v as Attr).value || "0"))
  );

  const weights = getPrefix(parsed).flatMap(([, root]) =>
    get("./bskArticle", root)
      .flatMap(
        (context) =>
          get(".//packInfo[@key='netWeight']/@originalValue", context) ??
          get(".//feature[@name='GEWICHT']/@value", context) ??
          get(".//feature[@name='Gewicht']/@value", context)
      )
      .map((v) => parseFloat((v as Attr).value || "0"))
  );
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
        200
      ),
      taxRatePercentage: 19,
    },
  };
}

export function createPayload(
  parsed: Document,
  multVal: number,
  includeDescription: boolean,
  xpath?: XPathEvaluator
) {
  evaluator = xpath ?? new XPathEvaluator();
  mult = isNaN(multVal) ? 1 : multVal;

  const now = new Date();
  const expiration = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 14
  );

  return JSON.stringify({
    voucherDate: now.toISOString(),
    expirationDate: expiration.toISOString(),
    address: { name: "Testkunde", countryCode: "DE" },
    lineItems: [
      // aggregateDuplicates(
      ...getPrefix(parsed).flatMap(([prefix, root]) =>
        get("./bskArticle", root).flatMap((context) =>
          createLineItem(context, prefix, includeDescription)
        )
      ),
      // ).flat(2),
      getShippingCosts(parsed),
    ],
    totalPrice: { currency: "EUR" },
    taxConditions: { taxType: "net" },
  });
}
