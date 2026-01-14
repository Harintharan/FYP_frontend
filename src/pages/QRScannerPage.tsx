import { useCallback, useRef, useState } from "react";
import { QRScanner } from "@/components/qr/QRScanner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Loader2, ScanLine, ShieldCheck } from "lucide-react";
import { api } from "@/services/api";
import { batchService } from "@/services/batchService";
import { PackageStatusDisplay } from "@/components/package/PackageStatusDisplay";
import { useAppToast } from "@/hooks/useAppToast";

type PackageStatusResponse = {
  package?: {
    package_uuid?: string;
    package_accepted?: string;
    batch_id?: string;
    created_at?: string;
    product?: {
      name?: string;
      type?: string;
      temperature_requirements?: { min?: string; max?: string };
    };
  };
  shipment_chain?: Array<{
    shipment_id?: string;
    manufacturer_uuid?: string;
    consumer_uuid?: string;
    status?: string;
    shipment_date?: string;
    segments?: Array<{
      segment_id?: string;
      from_location?: { name?: string; state?: string; country?: string };
      to_location?: { name?: string; state?: string; country?: string };
      status?: string;
      carrier?: string | null;
      expected_ship_date?: string;
      estimated_arrival_date?: string;
      segment_order?: number;
      start_timestamp?: string;
      end_timestamp?: string;
    }>;
  }>;
  breaches?: {
    statistics?: {
      total?: number;
      resolved?: number;
      active?: number;
      byType?: Record<string, number>;
      bySeverity?: Record<string, number>;
    };
    records?: Array<{
      breach_uuid?: string;
      breach_type?: string;
      severity?: string;
      status?: string;
      detected_at?: string;
      resolved_at?: string | null;
      detected_value?: string;
      threshold?: { min?: string | null; max?: string | null };
      location?: { latitude?: string; longitude?: string };
      blockchain?: { tx_hash?: string; ipfs_cid?: string | null };
    }>;
  };
  location_check?: {
    status?: string;
    range_km?: number;
    distance_km?: number | null;
    device_location?: { latitude?: number; longitude?: number };
    package_location?: { latitude?: number; longitude?: number };
    warning?: string | null;
  } | null;
};

type PdfLine = {
  text: string;
  color?: [number, number, number];
  font?: "regular" | "bold";
  size?: number;
  gapBefore?: number;
};

const sanitizeToAscii = (value: string) =>
  value
    .replace(/\r/g, "")
    .replace(/\t/g, " ")
    .replace(/[^\x20-\x7E]/g, "?")
    .trim();

const wrapLine = (line: PdfLine, limit = 86): PdfLine[] => {
  const safe = sanitizeToAscii(line.text);
  if (!safe) return [];

  const words = safe.split(/\s+/);
  const wrapped: PdfLine[] = [];
  let current = "";

  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > limit && current) {
      wrapped.push({ ...line, text: current, gapBefore: line.gapBefore });
      current = word;
      line.gapBefore = 0;
    } else {
      current = candidate;
    }
  });

  if (current) {
    wrapped.push({ ...line, text: current, gapBefore: line.gapBefore });
  }

  return wrapped;
};

const splitIntoPages = (lines: PdfLine[]) => {
  const pages: PdfLine[][] = [];
  const maxHeight = 740;
  let current: PdfLine[] = [];
  let currentHeight = 0;

  const heightForLine = (line: PdfLine) =>
    (line.size ?? 11) + 3 + (line.gapBefore ?? 0);

  lines.forEach((line) => {
    const lineHeight = heightForLine(line);
    if (currentHeight + lineHeight > maxHeight && current.length) {
      pages.push(current);
      current = [];
      currentHeight = 0;
    }
    current.push(line);
    currentHeight += lineHeight;
  });

  if (current.length) {
    pages.push(current);
  }

  return pages;
};

const escapePdfText = (text: string) =>
  sanitizeToAscii(text)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const buildPdfContentStream = (pageLines: PdfLine[]) => {
  const topPaddingLines = 2;
  const paddingHeight = topPaddingLines * 14; // approximate line height
  const startY = 787 - paddingHeight; // add two-line top padding
  const commands: string[] = ["BT", "/F1 11 Tf", "0 0 0 rg", `50 ${startY} Td`];

  pageLines.forEach((line, idx) => {
    const size = line.size ?? 11;
    const color = line.color ?? [0.15, 0.15, 0.18];
    const font = line.font === "bold" ? "/F2" : "/F1";
    const gap = line.gapBefore ?? 0;
    const moveY = idx === 0 ? 0 : size + 3 + gap;

    commands.push(`0 -${moveY} Td`);
    commands.push(`${color[0]} ${color[1]} ${color[2]} rg`);
    commands.push(`${font} ${size} Tf`);
    commands.push(`(${escapePdfText(line.text)}) Tj`);
  });

  commands.push("ET");
  return commands.join("\n");
};

const buildPdfBlob = (pages: PdfLine[][]) => {
  if (!pages.length) return null;

  const pageObjectsStart = 5;
  const contentObjectsStart = pageObjectsStart + pages.length;
  const lastObjectId = contentObjectsStart + pages.length - 1;

  const pdfObjects: Record<number, string> = {
    1: `1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj`,
    3: `3 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj`,
    4: `4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj`,
  };

  pages.forEach((pageLines, idx) => {
    const pageObjectId = pageObjectsStart + idx;
    const contentObjectId = contentObjectsStart + idx;
    const contentStream = buildPdfContentStream(pageLines);

    pdfObjects[pageObjectId] = `${pageObjectId} 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentObjectId} 0 R /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> >>
endobj`;

    pdfObjects[contentObjectId] = `${contentObjectId} 0 obj
<< /Length ${contentStream.length} >>
stream
${contentStream}
endstream
endobj`;
  });

  const kids = pages.map((_, idx) => `${pageObjectsStart + idx} 0 R`).join(" ");

  pdfObjects[2] = `2 0 obj
<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>
endobj`;

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let id = 1; id <= lastObjectId; id++) {
    const obj = pdfObjects[id];
    if (!obj) continue;
    offsets[id] = pdf.length;
    pdf += `${obj}\n`;
  }

  const xrefStart = pdf.length;
  pdf += `xref
0 ${lastObjectId + 1}
0000000000 65535 f 
`;

  for (let id = 1; id <= lastObjectId; id++) {
    const offset = offsets[id] ?? 0;
    pdf += `${String(offset).padStart(10, "0")} 00000 n 
`;
  }

  pdf += `trailer
<< /Size ${lastObjectId + 1} /Root 1 0 R >>
startxref
${xrefStart}
%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
};

const getDeviceCoordinates = () =>
  new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
    const isSecure = typeof window !== "undefined" && window.isSecureContext;
    if (
      !isSecure ||
      typeof navigator === "undefined" ||
      !navigator.geolocation
    ) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });

export default function QRScannerPage() {
  const { showWarning } = useAppToast();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastScannedValue, setLastScannedValue] = useState<string | null>(null);
  const [statusResult, setStatusResult] =
    useState<PackageStatusResponse | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement | null>(null);

  const handleScan = useCallback(async (payload: string) => {
    setScannerOpen(false);
    setDialogOpen(true);
    setIsSubmitting(true);
    setLastScannedValue(payload);
    setSubmissionError(null);
    setStatusResult(null);
    try {
      const normalized = payload.trim();
      const coords = await getDeviceCoordinates();
      const response = await api.get(`/api/package-status/${normalized}`, {
        params: coords ?? undefined,
      });
      const data = response.data?.data ?? response.data;
      setStatusResult(data ?? null);
      const locationCheck = data?.location_check;
      if (
        locationCheck &&
        locationCheck.status &&
        locationCheck.status !== "OK" &&
        locationCheck.status !== "NO_DEVICE_COORDS"
      ) {
        showWarning(
          locationCheck.warning ??
            "Device location does not match the package GPS range"
        );
      }
    } catch (error) {
      console.error("Failed to submit QR payload", error);
      setSubmissionError(
        "Unable to reach package status service. Please retry."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleDialogChange = (open: boolean) => {
    if (isSubmitting) return;
    setDialogOpen(open);
    if (!open) {
      setStatusResult(null);
      setSubmissionError(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current || !statusResult) return;

    // try to fetch batch expiry if available
    let batchExpiry: string | null = null;
    const batchId = statusResult.package?.batch_id;
    if (batchId) {
      try {
        const b = await batchService.getBatchById(batchId);
        batchExpiry =
          b?.expiryDate ??
          b?.expiry_date ??
          b?.batch?.expiryDate ??
          b?.batch?.expiry_date ??
          null;
      } catch (e) {
        // ignore
      }
    }

    const primary: [number, number, number] = [0.14, 0.32, 0.63];
    const secondary: [number, number, number] = [0.25, 0.55, 0.38];
    const muted: [number, number, number] = [0.38, 0.42, 0.48];
    const lines: PdfLine[] = [];

    const add = (text: string, opts: Partial<PdfLine> = {}) => {
      const wrapped = wrapLine({ text, ...opts });
      lines.push(...wrapped);
    };

    const addSection = (title: string) => {
      add(title, { font: "bold", size: 14, color: primary, gapBefore: 12 });
    };

    add("Package Status Report", { font: "bold", size: 18, color: primary });
    add(`Generated: ${new Date().toLocaleString()}`, {
      size: 10,
      color: muted,
      gapBefore: 6,
    });
    add(`Payload: ${lastScannedValue ?? "N/A"}`, {
      size: 10,
      color: muted,
      gapBefore: 2,
    });

    addSection("Product");
    add(`Name: ${statusResult.package?.product?.name ?? "Unknown"}`, {
      font: "bold",
    });
    add(`Type: ${statusResult.package?.product?.type ?? "N/A"}`);
    if (statusResult.package?.product?.temperature_requirements) {
      add(
        `Temperature: ${
          statusResult.package.product.temperature_requirements.min ?? "N/A"
        } to ${
          statusResult.package.product.temperature_requirements.max ?? "N/A"
        }`
      );
    }

    addSection("Manufacture & Expiry");
    add(
      `Manufacture: ${
        statusResult.package?.created_at
          ? new Date(statusResult.package.created_at).toLocaleString()
          : "N/A"
      }`
    );
    add(
      `Expiry: ${batchExpiry ? new Date(batchExpiry).toLocaleString() : "N/A"}`
    );

    addSection("Shipment Chain");
    if (statusResult.shipment_chain?.length) {
      statusResult.shipment_chain.forEach((shipment, idx) => {
        add(`Shipment ${idx + 1}: ${shipment.shipment_id ?? "N/A"}`, {
          font: "bold",
          gapBefore: 6,
        });
        add(`Status: ${shipment.status ?? "N/A"}`);
        add(
          `Shipped: ${
            shipment.shipment_date
              ? new Date(shipment.shipment_date).toLocaleString()
              : "N/A"
          }`
        );
        if (shipment.segments?.length) {
          shipment.segments.forEach((segment) => {
            add(
              `• Segment ${segment.segment_order ?? "-"}: ${
                segment.status ?? "N/A"
              }`,
              { gapBefore: 4 }
            );
            add(`  From: ${segment.from_location?.name ?? "Unknown"}`);
            add(`  To: ${segment.to_location?.name ?? "Unknown"}`);
            add(
              `  ETA: ${
                segment.estimated_arrival_date
                  ? new Date(segment.estimated_arrival_date).toLocaleString()
                  : "N/A"
              }`
            );
          });
        }
      });
    } else {
      add("No shipment records available.", { color: muted });
    }

    addSection("Breaches");
    const stats = statusResult.breaches?.statistics;
    if (stats) {
      add(
        `Total breaches: ${stats.total ?? 0}  — Active: ${stats.active ?? 0}`,
        { color: secondary }
      );
    }

    if (statusResult.breaches?.records?.length) {
      statusResult.breaches.records.forEach((breach, idx) => {
        add(`#${idx + 1} ${breach.breach_type ?? "Breach"}`, {
          font: "bold",
          gapBefore: 6,
        });
        if (
          breach.breach_type === "TEMPERATURE_EXCURSION" &&
          breach.detected_value
        ) {
          add(`Detected value: ${breach.detected_value}°C`);
          add(
            `Threshold: ${breach.threshold?.min ?? "N/A"}°C - ${
              breach.threshold?.max ?? "N/A"
            }°C`
          );
        }
        add(
          `Detected: ${
            breach.detected_at
              ? new Date(breach.detected_at).toLocaleString()
              : "N/A"
          }`
        );
        if (breach.location) {
          add(
            `Location: ${breach.location.latitude ?? "N/A"}, ${
              breach.location.longitude ?? "N/A"
            }`
          );
        }
      });
    } else {
      add("No breach records reported.", { color: muted });
    }

    const pages = splitIntoPages(lines);
    const pdfBlob = buildPdfBlob(pages);
    if (!pdfBlob) return;

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = statusResult.package?.package_uuid
      ? `package-${statusResult.package.package_uuid}.pdf`
      : "package-status.pdf";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-3 sm:p-4 md:p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -right-40 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-40 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main Content Container */}
      <div className="relative w-full max-w-3xl">
        {/* White Card Container */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 md:p-12 space-y-4 sm:space-y-6 md:space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-2 sm:space-y-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
              Verify Package Status
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 font-medium">
              Scan QR codes to check shipment status
            </p>
          </div>

          {/* Scanner Card */}
          <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-md hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:pt-6 sm:pb-6">
              {/* Primary Action Button */}
              <Button
                size="lg"
                className="w-full gap-2 sm:gap-3 h-12 sm:h-14 md:h-16 text-sm sm:text-base md:text-lg font-bold shadow-lg hover:shadow-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-white"
                onClick={() => setScannerOpen(true)}
              >
                <ScanLine className="h-5 w-5 sm:h-6 sm:w-6" />
                <span>Start Scanner</span>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="group rounded-xl sm:rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-blue-100/50 hover:from-blue-100/80 hover:to-blue-150/60 p-4 sm:p-6 transition-all duration-300 shadow-md hover:shadow-lg">
              <div className="flex gap-3 sm:gap-4 items-start">
                <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md group-hover:shadow-lg transition-shadow">
                  1
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-bold text-slate-900">Scan QR</p>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-1.5 leading-relaxed font-medium">
                    Point camera at label
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-xl sm:rounded-2xl border border-green-200 bg-gradient-to-br from-green-50/80 to-green-100/50 hover:from-green-100/80 hover:to-green-150/60 p-4 sm:p-6 transition-all duration-300 shadow-md hover:shadow-lg">
              <div className="flex gap-3 sm:gap-4 items-start">
                <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md group-hover:shadow-lg transition-shadow">
                  2
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-bold text-slate-900">Verify</p>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-1.5 leading-relaxed font-medium">
                    Instant verification
                  </p>
                </div>
              </div>
            </div>

            <div className="group rounded-xl sm:rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/80 to-purple-100/50 hover:from-purple-100/80 hover:to-purple-150/60 p-4 sm:p-6 transition-all duration-300 shadow-md hover:shadow-lg">
              <div className="flex gap-3 sm:gap-4 items-start">
                <div className="flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-md group-hover:shadow-lg transition-shadow">
                  3
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm sm:text-base font-bold text-slate-900">Export</p>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 sm:mt-1.5 leading-relaxed font-medium">
                    Download as PDF
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {scannerOpen ? (
        <QRScanner
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
          title="Scan encrypted QR"
        />
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-2xl p-3 sm:p-6">
          {isSubmitting ? (
            <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 py-8 sm:py-12">
              <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary" />
              <div className="text-center space-y-1 sm:space-y-2">
                <p className="font-medium text-sm sm:text-base">Verifying Package</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Checking blockchain and shipment data...
                </p>
              </div>
            </div>
          ) : submissionError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-destructive text-sm sm:text-base">
                    Verification Failed
                  </p>
                  <p className="text-xs sm:text-sm text-destructive/90 mt-1">
                    {submissionError}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full text-sm"
                onClick={() => handleDialogChange(false)}
              >
                Try Again
              </Button>
            </div>
          ) : statusResult ? (
            <div ref={printRef} className="space-y-3 sm:space-y-4">
              <PackageStatusDisplay data={statusResult} />
              <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4">
                <Button
                  variant="outline"
                  className="flex-1 text-sm h-9 sm:h-10"
                  onClick={() => handleDialogChange(false)}
                >
                  Close
                </Button>
                <Button className="flex-1 text-sm h-9 sm:h-10" onClick={handleDownloadPdf}>
                  Download PDF
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Scan a QR code to view verification details
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
