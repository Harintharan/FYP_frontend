import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Search,
  Eye,
  Copy,
  AlertTriangle,
  Lock,
  Thermometer,
} from "lucide-react";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { useAppStore } from "@/lib/store";

// API base URL - same pattern as other APIs
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface AlertData {
  id?: string;
  packageId: string;
  breachId?: string;
  alertType: string;
  severity: string;
  breachTime: string;
  shipmentId?: string;
  segmentId?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  measuredValue?: number;
  measuredAvgValue?: number;
  measuredMinValue?: number;
  measuredMaxValue?: number;
  expectedMinValue?: number;
  expectedMaxValue?: number;
  minValue?: number;
  maxValue?: number;
  durationSeconds?: number;
  breachCertainty?: string;
  notes?: string;
}

interface AlertTableProps {
  apiEndpoint: string; // "/api/alerts/manufacturer" or "/api/alerts/supplier"
  columns: Array<
    | "packageId"
    | "alertType"
    | "severity"
    | "shipmentId"
    | "segmentId"
    | "location"
    | "breachTime"
  >;
}

export function AlertTable({ apiEndpoint, columns }: AlertTableProps) {
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null);
  const [copied, setCopied] = useState("");
  const [enrichingAlert, setEnrichingAlert] = useState(false);

  // Get token from Zustand store
  const token = useAppStore((state) => state.token);

  const limit = 10;

  useEffect(() => {
    console.log("🔄 AlertTable useEffect triggered, searchTerm:", searchTerm);
    fetchAlerts(1);
  }, [searchTerm]);

  const fetchAlerts = async (page: number) => {
    console.log("📡 fetchAlerts called with page:", page);
    console.log("🔑 Token from store:", token ? "EXISTS" : "MISSING");
    console.log("📍 API_URL:", API_URL);
    console.log("📍 apiEndpoint:", apiEndpoint);

    setLoading(true);
    setError("");
    try {
      // Check if token exists
      if (!token) {
        console.log("❌ No token found in store");
        setError("Authentication required. Please log in.");
        setAlerts([]);
        setLoading(false);
        return;
      }

      const fullUrl = `${API_URL}${apiEndpoint}?page=${page}&limit=${limit}&search=${encodeURIComponent(
        searchTerm
      )}`;
      console.log("🌐 Fetching from:", fullUrl);

      const response = await fetch(fullUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("📦 Response status:", response.status);

      if (!response.ok) {
        if (response.status === 401) {
          setError("Session expired. Please log in again.");
          setAlerts([]);
          setLoading(false);
          return;
        }
        throw new Error("Failed to fetch alerts");
      }

      const result = await response.json();
      console.log("✅ Response data:", result);
      setAlerts(result.data || []);
      setTotalPages(result.pagination?.totalPages || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch alerts");
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 2000);
  };

  const getSeverityColor = (severity: string) => {
    if (severity === "CRITICAL") return "destructive";
    if (severity === "WARNING") return "outline"; // Yellow/warning style
    if (severity === "HIGH") return "destructive";
    return "secondary";
  };

  const getSeverityBgClass = (severity: string) => {
    if (severity === "CRITICAL") return "bg-red-50 border-red-200";
    if (severity === "WARNING") return "bg-yellow-50 border-yellow-200";
    if (severity === "HIGH") return "bg-red-50 border-red-200";
    return "bg-blue-50 border-blue-200";
  };

  const getAlertTypeIcon = (alertType: string) => {
    if (alertType.includes("Unauthorized")) return <Lock className="h-4 w-4" />;
    if (alertType.includes("Temperature"))
      return <Thermometer className="h-4 w-4" />;
    if (alertType.includes("Door"))
      return <AlertTriangle className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const formatTemperature = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num as number)) return "N/A";
    return (num as number).toFixed(2);
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  // Enrich alert with temperature data if missing
  const enrichAlertWithTemperatureData = async (alert: AlertData) => {
    // Check if we already have the temperature data
    let enrichedAlert = { ...alert };

    // Map backend fields to expected fields if they exist
    if (alert.minValue !== undefined) {
      enrichedAlert.expectedMinValue = alert.minValue;
    }
    if (alert.maxValue !== undefined) {
      enrichedAlert.expectedMaxValue = alert.maxValue;
    }
    if (alert.measuredValue !== undefined) {
      enrichedAlert.measuredAvgValue = alert.measuredValue;
    }

    // Check if we still need to fetch (for alerts without these fields)
    if (
      enrichedAlert.expectedMinValue !== undefined &&
      enrichedAlert.expectedMaxValue !== undefined
    ) {
      return enrichedAlert; // Already has data
    }

    // Try to fetch from specific endpoint if data is missing
    if (!alert.packageId) {
      return enrichedAlert;
    }

    try {
      setEnrichingAlert(true);
      const response = await fetch(
        `${API_URL}/api/alerts/temperature-specs/${alert.packageId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const specs = await response.json();
        enrichedAlert = {
          ...enrichedAlert,
          expectedMinValue: specs.minTemp || specs.expectedMinValue,
          expectedMaxValue: specs.maxTemp || specs.expectedMaxValue,
          measuredAvgValue: specs.measuredTemp || specs.measuredValue,
        };
      }
    } catch (err) {
      console.warn("Could not fetch temperature specs:", err);
    } finally {
      setEnrichingAlert(false);
    }

    return enrichedAlert;
  };

  const handleOpenAlert = async (alert: AlertData) => {
    const enriched = await enrichAlertWithTemperatureData(alert);
    setSelectedAlert(enriched);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
        <Input
          placeholder="Search by Package ID..."
          value={searchTerm}
          onChange={handleSearch}
          className="pl-9 sm:pl-10 py-4 sm:py-6 text-sm sm:text-base"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="-mx-3 sm:mx-0 border sm:rounded-lg overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <Table className="min-w-[600px] sm:min-w-0">
          <TableHeader className="bg-gradient-to-r from-slate-100 to-slate-50 border-b">
            <TableRow className="hover:bg-transparent">
              {columns.includes("packageId") && (
                <TableHead className="font-semibold text-slate-700">
                  Package ID
                </TableHead>
              )}
              {columns.includes("alertType") && (
                <TableHead className="font-semibold text-slate-700">
                  Alert Type
                </TableHead>
              )}
              {columns.includes("severity") && (
                <TableHead className="font-semibold text-slate-700">
                  Severity
                </TableHead>
              )}
              {columns.includes("shipmentId") && (
                <TableHead className="font-semibold text-slate-700">
                  Shipment ID
                </TableHead>
              )}
              {columns.includes("segmentId") && (
                <TableHead className="font-semibold text-slate-700">
                  Segment ID
                </TableHead>
              )}
              {columns.includes("location") && (
                <TableHead className="font-semibold text-slate-700">
                  Location
                </TableHead>
              )}
              {columns.includes("breachTime") && (
                <TableHead className="font-semibold text-slate-700">
                  Breach Time
                </TableHead>
              )}
              <TableHead className="font-semibold text-slate-700 text-center w-16">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="text-center py-12"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
                    <span className="text-slate-600">Loading alerts...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : alerts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="text-center py-12 text-muted-foreground"
                >
                  <div className="space-y-2">
                    <div className="text-lg">No alerts found</div>
                    <div className="text-sm">
                      Try adjusting your search criteria
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => (
                <TableRow
                  key={alert.breachId}
                  className={`hover:bg-slate-50 transition border-b ${getSeverityBgClass(
                    alert.severity
                  )}`}
                >
                  {columns.includes("packageId") && (
                    <TableCell className="font-mono text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 px-2 py-1 rounded">
                          {alert.packageId}
                        </span>
                        <button
                          onClick={() =>
                            copyToClipboard(alert.packageId, "packageId")
                          }
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      {copied === "packageId" && (
                        <span className="text-xs text-green-600">Copied!</span>
                      )}
                    </TableCell>
                  )}
                  {columns.includes("alertType") && (
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600 flex-shrink-0">
                          {getAlertTypeIcon(alert.alertType)}
                        </span>
                        <span className="text-sm font-medium text-slate-700">
                          {alert.alertType}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  {columns.includes("severity") && (
                    <TableCell>
                      <Badge
                        variant={getSeverityColor(alert.severity)}
                        className={
                          alert.severity === "WARNING"
                            ? "bg-yellow-200 text-yellow-800 hover:bg-yellow-300"
                            : ""
                        }
                      >
                        {alert.severity}
                      </Badge>
                    </TableCell>
                  )}
                  {columns.includes("shipmentId") && (
                    <TableCell className="font-mono text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 px-2 py-1 rounded max-w-xs overflow-hidden text-ellipsis">
                          {alert.shipmentId ? alert.shipmentId : "N/A"}
                        </span>
                        {alert.shipmentId && (
                          <button
                            onClick={() =>
                              copyToClipboard(alert.shipmentId!, "shipmentId")
                            }
                            className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      {copied === "shipmentId" && (
                        <span className="text-xs text-green-600">Copied!</span>
                      )}
                    </TableCell>
                  )}
                  {columns.includes("segmentId") && (
                    <TableCell className="font-mono text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 px-2 py-1 rounded max-w-xs overflow-hidden text-ellipsis">
                          {alert.segmentId ? alert.segmentId : "N/A"}
                        </span>
                        {alert.segmentId && (
                          <button
                            onClick={() =>
                              copyToClipboard(alert.segmentId!, "segmentId")
                            }
                            className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      {copied === "segmentId" && (
                        <span className="text-xs text-green-600">Copied!</span>
                      )}
                    </TableCell>
                  )}
                  {columns.includes("location") && (
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="gap-1 text-xs h-7"
                      >
                        <a
                          href={`https://www.google.com/maps?q=${alert.location.latitude},${alert.location.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MapPin className="h-3 w-3" />
                          Map
                        </a>
                      </Button>
                    </TableCell>
                  )}
                  {columns.includes("breachTime") && (
                    <TableCell className="text-xs text-slate-700">
                      <div className="space-y-1 font-medium">
                        <div>
                          {new Date(alert.breachTime).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(alert.breachTime).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )}
                        </div>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAlert(alert)}
                      className="gap-2 text-xs h-7 hover:bg-slate-100"
                      title="View Details"
                      disabled={enrichingAlert}
                    >
                      <Eye className="h-3 w-3 text-slate-600" />
                      <span>{enrichingAlert ? "Loading..." : "View"}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex justify-center overflow-x-auto pb-2">
          <Pagination>
            <PaginationContent className="gap-0.5 sm:gap-1">
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => fetchAlerts(currentPage - 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              )}

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  page = currentPage - 2 + i;
                }
                if (page > totalPages) return null;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => fetchAlerts(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              }).filter(Boolean)}

              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext
                    onClick={() => fetchAlerts(currentPage + 1)}
                    className="cursor-pointer"
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Summary */}
      {!loading && alerts.length > 0 && (
        <div className="text-[10px] sm:text-xs text-slate-500 text-center bg-slate-50 rounded-lg py-2 sm:py-3">
          Page {currentPage} of {totalPages} | {alerts.length} alerts shown
        </div>
      )}

      {/* Detail Modal - Compact Design */}
      <Dialog
        open={!!selectedAlert}
        onOpenChange={(open) => !open && setSelectedAlert(null)}
      >
        <DialogContent className="mx-2 w-[calc(100%-1rem)] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-0 bg-white rounded-xl sm:rounded-2xl">
          {selectedAlert && (
            <div className="p-4 sm:p-6">
              {/* Alert Header with Description */}
              <div className="mb-3 sm:mb-4">
                <div className="flex items-start gap-2 sm:gap-3 mb-1">
                  <div className="text-xl sm:text-2xl flex-shrink-0">
                    {selectedAlert.severity === "CRITICAL" ? "⚠️" : "🌡️"}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      {selectedAlert.alertType}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Severity & Time */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
                <Badge
                  variant={getSeverityColor(selectedAlert.severity)}
                  className={
                    selectedAlert.severity === "WARNING"
                      ? "bg-yellow-200 text-yellow-800 font-bold text-xs"
                      : selectedAlert.severity === "CRITICAL"
                      ? "bg-red-500 text-white font-bold text-xs"
                      : ""
                  }
                >
                  {selectedAlert.severity}
                </Badge>
                <span className="text-xs text-slate-500">
                  {new Date(selectedAlert.breachTime).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>

              {/* Additional Details Section */}
              <div
                className={`rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-2 sm:space-y-3 ${getSeverityBgClass(
                  selectedAlert.severity
                )}`}
              >
                <h3 className="font-semibold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                  <span>📋</span>
                  Additional Details
                </h3>

                {/* Package ID */}
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase">
                    Package ID
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-[10px] sm:text-xs font-mono bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 flex-1 overflow-hidden text-slate-900 truncate">
                      {selectedAlert.packageId}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          selectedAlert.packageId,
                          "detail-packageId"
                        )
                      }
                      className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                      title="Copy"
                    >
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                  {copied === "detail-packageId" && (
                    <span className="text-xs text-green-600 font-bold mt-1">
                      ✓ Copied
                    </span>
                  )}
                </div>

                {/* Shipment/Segment IDs - Full Width */}
                {selectedAlert.shipmentId && (
                  <div>
                    <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase">
                      Shipment ID
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-[10px] sm:text-xs font-mono bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 flex-1 text-slate-900 break-all">
                        {selectedAlert.shipmentId}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            selectedAlert.shipmentId!,
                            "detail-shipmentId"
                          )
                        }
                        className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                        title="Copy"
                      >
                        <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                    {copied === "detail-shipmentId" && (
                      <span className="text-xs text-green-600 font-bold mt-1">
                        ✓ Copied
                      </span>
                    )}
                  </div>
                )}
                {selectedAlert.segmentId && (
                  <div>
                    <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase">
                      Segment ID
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-[10px] sm:text-xs font-mono bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 flex-1 text-slate-900 break-all">
                        {selectedAlert.segmentId}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            selectedAlert.segmentId!,
                            "detail-segmentId"
                          )
                        }
                        className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                        title="Copy"
                      >
                        <Copy className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                    {copied === "detail-segmentId" && (
                      <span className="text-xs text-green-600 font-bold mt-1">
                        ✓ Copied
                      </span>
                    )}
                  </div>
                )}

                {/* Location - One Line */}
                <div>
                  <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase">
                    Location
                  </label>
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2 mt-1">
                    <div className="bg-white rounded-lg border border-slate-300 px-2 sm:px-3 py-1.5 sm:py-2 flex-1 min-w-0">
                      <span className="text-[10px] sm:text-xs text-slate-600">Lat</span>
                      <div className="text-[10px] sm:text-xs font-mono font-bold text-slate-900 truncate">
                        {selectedAlert.location.latitude.toFixed(4)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-300 px-2 sm:px-3 py-1.5 sm:py-2 flex-1 min-w-0">
                      <span className="text-[10px] sm:text-xs text-slate-600">Long</span>
                      <div className="text-[10px] sm:text-xs font-mono font-bold text-slate-900 truncate">
                        {selectedAlert.location.longitude.toFixed(4)}
                      </div>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedAlert.location.latitude},${selectedAlert.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 flex-shrink-0 p-1.5 sm:p-2 bg-blue-50 rounded-lg"
                      title="View Map"
                    >
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                    </a>
                  </div>
                </div>

                {/* Temperature Measurement - Only for Temperature Excursion */}
                {selectedAlert.alertType.includes("Temperature") &&
                  selectedAlert.expectedMinValue !== undefined &&
                  selectedAlert.expectedMaxValue !== undefined && (
                    <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-3 sm:p-4">
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2 mb-2 sm:mb-3">
                        <span>🌡️</span>
                        Temperature Measurement
                      </h4>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <div className="bg-white rounded-lg border-2 border-orange-200 p-2 sm:p-3">
                          <label className="text-[10px] sm:text-xs font-bold text-orange-600 uppercase block mb-1 sm:mb-2">
                            Allowed Range
                          </label>
                          <div className="text-sm sm:text-base font-mono font-bold text-slate-900">
                            {formatTemperature(selectedAlert.expectedMinValue)}°
                            -{" "}
                            {formatTemperature(selectedAlert.expectedMaxValue)}
                            °C
                          </div>
                        </div>
                        {selectedAlert.measuredAvgValue !== undefined && (
                          <div className="bg-red-50 rounded-lg border-2 border-red-300 p-2 sm:p-3">
                            <label className="text-[10px] sm:text-xs font-bold text-red-600 uppercase block mb-1 sm:mb-2">
                              Measured Value
                            </label>
                            <div className="text-sm sm:text-base font-mono font-bold text-red-700">
                              {formatTemperature(
                                selectedAlert.measuredAvgValue
                              )}
                              °C
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Duration & Certainty */}
                {selectedAlert.durationSeconds !== undefined && (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase">
                        Duration
                      </label>
                      <div className="text-xs sm:text-sm font-bold text-slate-900 mt-1 bg-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-slate-300 text-center">
                        {formatDuration(selectedAlert.durationSeconds)}
                      </div>
                    </div>
                    {selectedAlert.breachCertainty && (
                      <div>
                        <label className="text-[10px] sm:text-xs font-bold text-slate-600 uppercase">
                          Certainty
                        </label>
                        <div className="text-[10px] sm:text-xs font-bold text-green-700 mt-1 bg-green-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-green-300 text-center">
                          ✓ {selectedAlert.breachCertainty}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
