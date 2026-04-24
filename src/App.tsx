import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";
import {
  type SubmitEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createQuotation, kmLogin, kmShippingPrice } from "./api.ts";
import { Cog } from "./components/Cog.tsx";
import { ErrorDialog } from "./components/ErrorDialog.tsx";
import { CustomerInput } from "./components/form/CustomerInput.tsx";
import { DropZone } from "./components/form/DropZone.tsx";
import { MultiplierInput } from "./components/form/MultiplierInput.tsx";
import { LineItemsRenderer } from "./components/lineitems/LineItemsRenderer.tsx";
import { NonDiscountedWarningDialog } from "./components/NonDiscountedWarningDialog.tsx";
import { SettingsModal } from "./components/SettingsModal.tsx";
import { computeShippingInputs, createPayload } from "./obx.ts";
import type { Address, CustomLineItem, LineItem, Quotation } from "./types.ts";

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem("apiKey") || "");
  const [version, setVersion] = useState("");
  const [multiplier, setMultiplier] = useState(1);
  const [kmUsername, setKmUsername] = useState(localStorage.getItem("kmUsername") ?? "");
  const [kmPassword, setKmPassword] = useState(localStorage.getItem("kmPassword") ?? "");
  const kmSessionRef = useRef<{
    token: string;
    expiresAt: number;
    username: string;
    password: string;
  } | null>(null);
  const [grouping, setGrouping] = useState(
    localStorage.getItem("grouping") !== "false",
  );
  const [description, setDescription] = useState(
    localStorage.getItem("description") !== "false",
  );
  const [xmlDocs, setXmlDocs] = useState<Record<string, Document>>({});
  const [customer, setCustomer] = useState<Address | undefined>();
  const [payload, setPayload] = useState<Quotation | undefined>();
  const [error, setError] = useState<string>("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [nonDiscountedArtNrs, setNonDiscountedArtNrs] = useState<Set<string>>(
    new Set(),
  );
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [nonDiscountedStats, setNonDiscountedStats] = useState({
    count: 0,
    totalValue: 0,
  });

  useEffect(() => {
    void getVersion().then(setVersion);

    // Load non-discounted article numbers from localStorage
    const stored = localStorage.getItem("nonDiscountedArtNrs");
    if (stored) {
      try {
        const artNrs = JSON.parse(stored) as string[];
        setNonDiscountedArtNrs(new Set(artNrs));
      } catch (error) {
        console.error("Error loading non-discounted article numbers:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("grouping", String(grouping));
  }, [grouping]);

  useEffect(() => {
    localStorage.setItem("description", String(description));
  }, [description]);

  const calculateNonDiscountedStats = useCallback((quotation: Quotation) => {
    let count = 0;
    let totalValue = 0;

    for (const item of quotation.lineItems) {
      if (
        "isNonDiscounted" in item &&
        (item as CustomLineItem).isNonDiscounted
      ) {
        count++;
        const customItem = item as CustomLineItem;
        totalValue += customItem.unitPrice.netAmount * customItem.quantity;
      }
    }

    setNonDiscountedStats({ count, totalValue });

    // Show warning dialog if there are non-discounted items
    if (count > 0) {
      setWarningDialogOpen(true);
    }
  }, []);

  const getShippingCost = useCallback(
    async (volume_m3: number, zip: string): Promise<number | null> => {
      if (!kmUsername || !kmPassword) return null;
      try {
        const now = Date.now();
        const cached = kmSessionRef.current;
        if (
          !cached ||
          cached.expiresAt <= now ||
          cached.username !== kmUsername ||
          cached.password !== kmPassword
        ) {
          const token = await kmLogin(kmUsername, kmPassword);
          kmSessionRef.current = {
            token,
            expiresAt: now + 23 * 60 * 60 * 1000,
            username: kmUsername,
            password: kmPassword,
          };
        }
        const { token } = kmSessionRef.current ?? { token: "" };
        return await kmShippingPrice(token, zip, volume_m3);
      } catch (err) {
        console.error("Km API error, using approximation:", err);
        return null;
      }
    },
    [kmUsername, kmPassword],
  );

  useEffect(() => {
    if (Object.keys(xmlDocs).length === 0) {
      setPayload(undefined);
      setNonDiscountedStats({ count: 0, totalValue: 0 });
      return;
    }

    (async () => {
      const parsedArg =
        Object.keys(xmlDocs).length === 1 ? Object.values(xmlDocs)[0] : xmlDocs;

      const { volumes } = computeShippingInputs(parsedArg);
      const totalVolume = volumes.filter(Boolean).reduce((s, v) => s + v, 0);
      const zip = customer?.zip ?? "24103";

      const apiPrice = await getShippingCost(totalVolume, zip);

      const newPayload = createPayload(
        parsedArg,
        multiplier,
        description,
        grouping,
        customer,
        undefined,
        nonDiscountedArtNrs,
      );

      if (apiPrice !== null) {
        const lastItem = newPayload.lineItems[newPayload.lineItems.length - 1];
        if (lastItem && "unitPrice" in lastItem) {
          (lastItem as CustomLineItem).unitPrice.netAmount = apiPrice;
        }
      }

      setPayload(newPayload);
      calculateNonDiscountedStats(newPayload);
    })();
  }, [
    xmlDocs,
    multiplier,
    grouping,
    description,
    customer,
    nonDiscountedArtNrs,
    calculateNonDiscountedStats,
    getShippingCost,
  ]);

  const handleItemDeleted = (index: number) => {
    if (payload) {
      const newPayload = { ...payload };
      newPayload.lineItems = newPayload.lineItems.filter((_, i) => i !== index);
      setPayload(newPayload);
    }
  };

  const handleItemChanged = (index: number, item: LineItem) => {
    if (payload) {
      const newPayload = { ...payload };
      newPayload.lineItems[index] = item;
      setPayload(newPayload);
    }
  };

  async function handleFileSelect(
    content: Promise<string> | string,
    filename: string,
  ) {
    const parser = new DOMParser();
    const parsed = parser.parseFromString(await content, "application/xml");
    setXmlDocs((prev) => ({ ...prev, [filename]: parsed }));
  }

  function handleFileRemove(filename: string) {
    setXmlDocs((prev) => {
      const next = { ...prev };
      delete next[filename];
      return next;
    });
  }

  function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (payload) {
      createQuotation(payload, apiKey)
        .then((quotationId) => {
          void openUrl(
            `https://app.lexware.de/permalink/quotations/view/${quotationId}`,
          );
          location.reload();
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : String(err));
        });
    } else {
      setError("Keine Daten zum Importieren vorhanden!");
    }
  }

  return (
    <>
      <div className="my-4 flex items-center justify-between">
        <h1 className="font-medium text-3xl">
          Lexware OBX Importer
          <small className="px-2 font-light text-gray-400 text-xs">
            {version}
          </small>
        </h1>
        <button
          type="button"
          onClick={() => setSettingsOpen(true)}
          className="text-gray-400 transition-colors hover:text-gray-600"
          aria-label="Einstellungen öffnen"
        >
          <Cog />
        </button>
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onApiKeyChange={setApiKey}
        grouping={grouping}
        onGroupingChange={setGrouping}
        description={description}
        onDescriptionChange={setDescription}
        onNonDiscountedListChange={setNonDiscountedArtNrs}
        kmUsername={kmUsername}
        onKmUsernameChange={(v) => {
          setKmUsername(v);
          localStorage.setItem("kmUsername", v);
        }}
        kmPassword={kmPassword}
        onKmPasswordChange={(v) => {
          setKmPassword(v);
          localStorage.setItem("kmPassword", v);
        }}
      />

      <NonDiscountedWarningDialog
        isOpen={warningDialogOpen}
        onClose={() => setWarningDialogOpen(false)}
        count={nonDiscountedStats.count}
        totalValue={nonDiscountedStats.totalValue}
      />

      <form onSubmit={submit} className="w-full max-w-full space-y-2">
        <DropZone
          loadedFiles={Object.keys(xmlDocs)}
          onFileSelect={(c, filename) => void handleFileSelect(c, filename)}
          onFileRemove={handleFileRemove}
        />
        <MultiplierInput onChange={setMultiplier} />
        <CustomerInput onChange={setCustomer} />
        <div className="mt-4 flex justify-end space-x-4">
          <input
            type="reset"
            value="Zurücksetzen"
            className="rounded-md bg-white px-3 py-1.5 font-semibold text-sm shadow transition-all hover:bg-gray-200"
            onClick={() => location.reload()}
          />
          <input
            id="submit"
            type="submit"
            value="Importieren"
            className="rounded-md bg-blue-500 px-3 py-1.5 font-semibold text-sm text-white shadow transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!apiKey}
          />
        </div>
      </form>
      {payload && (
        <Disclosure as="div" className="max-w-full">
          <DisclosureButton className="text-gray-300 text-sm hover:text-gray-600">
            JSON Vorschau anzeigen
          </DisclosureButton>
          <DisclosurePanel>
            <pre className="max-h-64 overflow-auto rounded border border-gray-300 bg-white p-4 text-xs">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </DisclosurePanel>
        </Disclosure>
      )}
      <LineItemsRenderer
        payload={payload}
        onItemDeleted={handleItemDeleted}
        onItemChanged={handleItemChanged}
      />

      <ErrorDialog message={error} payload={payload} setMessage={setError} />
    </>
  );
}
