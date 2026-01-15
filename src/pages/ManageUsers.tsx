import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { registrationService } from "@/services/registrationService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppToast } from "@/hooks/useAppToast";
import { Loader2, Eye, CheckCircle2, Clock, Copy, Check } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ManageUsers() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAppToast();
  const [selected, setSelected] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, itemId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(itemId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getIntegrityMeta = (value?: string | null) => {
    const normalized = value?.toLowerCase();
    if (normalized === "valid") {
      return {
        label: "Verified",
        className: "border-emerald-200 bg-emerald-100 text-emerald-800",
      };
    }
    if (normalized === "tampered" || normalized === "mismatch") {
      return {
        label: "Tampered",
        className: "border-rose-200 bg-rose-100 text-rose-800",
      };
    }
    if (normalized === "not_on_chain") {
      return {
        label: "Not on chain",
        className: "border-amber-200 bg-amber-100 text-amber-800",
      };
    }
    return {
      label: "Unknown",
      className: "border-border bg-muted text-muted-foreground",
    };
  };

  // ✅ Queries
  const { data: pending, isLoading: loadingPending } = useQuery({
    queryKey: ["pending-registrations"],
    queryFn: registrationService.getPending,
  });

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ["approved-users"],
    queryFn: registrationService.getApproved,
  });

  // 🔹 Fetch single user details
  const handleView = async (registrationId: string) => {
    try {
      const data = await registrationService.getById(registrationId);
      setSelected(data);
    } catch (err: any) {
      showError(err.response?.data?.error || "Failed to load details");
    }
  };

  // ✅ Approve pending registration
  const approveMutation = useMutation({
    mutationFn: (registrationId: string) =>
      registrationService.approve(registrationId),
    onSuccess: () => {
      showSuccess("User approved");
      queryClient.invalidateQueries({ queryKey: ["pending-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["approved-users"] });
      setSelected(null);
    },
    onError: (err: any) => {
      showError(err.response?.data?.error || "Approval failed");
    },
  });

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
        Manage Users
      </h1>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-3 sm:mb-4 w-full sm:w-auto">
          <TabsTrigger
            value="users"
            className="flex-1 sm:flex-none text-xs sm:text-sm"
          >
            Users
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="flex-1 sm:flex-none text-xs sm:text-sm"
          >
            Pending
          </TabsTrigger>
        </TabsList>

        {/* ✅ Approved Users */}
        <TabsContent value="users">
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-lg">
            <CardContent className="p-0">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  <Loader2 className="animate-spin mr-2 h-5 w-5" /> Loading
                  users...
                </div>
              ) : users?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mb-2 opacity-40" />
                  <p className="text-sm">No users found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <th className="text-left px-4 sm:px-6 py-4 font-bold">
                          ID
                        </th>
                        <th className="text-left px-4 sm:px-6 py-4 font-bold">
                          Tx Hash
                        </th>
                        <th className="text-left px-4 sm:px-6 py-4 font-bold hidden sm:table-cell">
                          Type
                        </th>
                        <th className="text-left px-4 sm:px-6 py-4 font-bold">
                          Integrity
                        </th>
                        <th className="text-left px-4 sm:px-6 py-4 font-bold hidden lg:table-cell">
                          Created
                        </th>
                        <th className="text-right px-4 sm:px-6 py-4 font-bold">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user: any, idx: number) => (
                        <tr
                          key={user.id}
                          className={`border-b border-slate-200 hover:bg-blue-100 transition-all duration-200 ${
                            idx % 2 === 0 ? "bg-white" : "bg-slate-50"
                          }`}
                        >
                          <td className="px-4 sm:px-6 py-4 font-mono text-xs text-slate-700 break-all">
                            <div className="flex items-center gap-2 group">
                              <span className="font-semibold">{user.id}</span>
                              <button
                                onClick={() =>
                                  copyToClipboard(user.id, `id-${user.id}`)
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-200 rounded"
                                title="Copy ID"
                              >
                                {copiedId === `id-${user.id}` ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-slate-500" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 font-mono text-xs text-slate-700 break-all">
                            <div className="flex items-center gap-2 group">
                              <span className="font-semibold">
                                {user.tx_hash}
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    user.tx_hash || "",
                                    `hash-${user.id}`
                                  )
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-200 rounded"
                                title="Copy Tx Hash"
                              >
                                {copiedId === `hash-${user.id}` ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-slate-500" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 font-semibold hidden sm:table-cell">
                            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-md">
                              {user.reg_type}
                            </Badge>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <Badge
                              variant="outline"
                              className={`text-xs font-semibold ${
                                getIntegrityMeta(user.integrity).className
                              }`}
                            >
                              {getIntegrityMeta(user.integrity).label}
                            </Badge>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-slate-600 text-xs hidden lg:table-cell font-medium">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-right">
                            <Button
                              size="sm"
                              onClick={() => handleView(user.id)}
                              className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-md"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 🕓 Pending Users */}
        <TabsContent value="pending">
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg">
            <CardContent className="p-0">
              {loadingPending ? (
                <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
                  <Loader2 className="animate-spin mr-2 h-5 w-5" /> Loading
                  pending requests...
                </div>
              ) : pending?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mb-2 text-green-500 opacity-60" />
                  <p className="text-sm">✅ No pending registrations.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-amber-300 bg-gradient-to-r from-amber-600 to-orange-600 text-white">
                        <th className="text-left px-4 sm:px-6 py-4 font-bold">
                          ID
                        </th>
                        <th className="text-left px-4 sm:px-6 py-4 font-bold">
                          Tx Hash
                        </th>
                        <th className="text-left px-4 sm:px-6 py-4 font-bold hidden sm:table-cell">
                          Type
                        </th>
                        <th className="text-left px-4 sm:px-6 py-4 font-bold">
                          Integrity
                        </th>
                        <th className="text-left px-4 sm:px-6 py-4 font-bold hidden lg:table-cell">
                          Created
                        </th>
                        <th className="text-right px-4 sm:px-6 py-4 font-bold">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pending.map((item: any, idx: number) => (
                        <tr
                          key={item.id}
                          className={`border-b border-amber-200 hover:bg-amber-100 transition-all duration-200 ${
                            idx % 2 === 0 ? "bg-white" : "bg-amber-50"
                          }`}
                        >
                          <td className="px-4 sm:px-6 py-4 font-mono text-xs text-slate-700 break-all">
                            <div className="flex items-center gap-2 group">
                              <span className="font-semibold">{item.id}</span>
                              <button
                                onClick={() =>
                                  copyToClipboard(item.id, `id-${item.id}`)
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-amber-200 rounded"
                                title="Copy ID"
                              >
                                {copiedId === `id-${item.id}` ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-slate-500" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 font-mono text-xs text-slate-700 break-all">
                            <div className="flex items-center gap-2 group">
                              <span className="font-semibold">
                                {item.tx_hash}
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    item.tx_hash || "",
                                    `hash-${item.id}`
                                  )
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-amber-200 rounded"
                                title="Copy Tx Hash"
                              >
                                {copiedId === `hash-${item.id}` ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Copy className="h-4 w-4 text-slate-500" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 font-semibold hidden sm:table-cell">
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-md">
                              {item.reg_type}
                            </Badge>
                          </td>
                          <td className="px-4 sm:px-6 py-4">
                            <Badge
                              variant="outline"
                              className={`text-xs font-semibold ${
                                getIntegrityMeta(item.integrity).className
                              }`}
                            >
                              {getIntegrityMeta(item.integrity).label}
                            </Badge>
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-slate-600 text-xs hidden lg:table-cell font-medium">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 sm:px-6 py-4 text-right">
                            <div className="flex gap-2 justify-end flex-wrap">
                              <Button
                                size="sm"
                                onClick={() => handleView(item.id)}
                                className="text-xs h-8 bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-md"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1" />
                                View
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => approveMutation.mutate(item.id)}
                                disabled={approveMutation.isPending}
                                className="text-xs h-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-md disabled:opacity-50"
                              >
                                {approveMutation.isPending ? (
                                  <Loader2 className="animate-spin w-3.5 h-3.5 mr-1" />
                                ) : (
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                )}
                                Approve
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 🔍 Details Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3 sm:p-4">
          <Card className="w-full max-w-lg shadow-xl bg-background max-h-[90vh] overflow-y-auto">
            <CardHeader className="p-3 sm:p-4 flex flex-row items-start justify-between gap-2">
              <CardTitle className="text-sm sm:text-base">
                {selected.payload?.type || selected.reg_type || "User Details"}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive h-7 sm:h-8 text-xs"
                onClick={() => setSelected(null)}
              >
                Close
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
              <p className="truncate">
                <b>UUID:</b> {selected.payload?.identification?.uuid}
              </p>
              <p className="truncate">
                <b>Legal Name:</b> {selected.payload?.identification?.legalName}
              </p>
              <div className="flex items-center gap-2">
                <b>Integrity:</b>
                <Badge
                  variant="outline"
                  className={`text-[10px] sm:text-xs ${
                    getIntegrityMeta(selected.integrity).className
                  }`}
                >
                  {getIntegrityMeta(selected.integrity).label}
                </Badge>
              </div>
              <p className="break-all">
                <b>Public Key:</b> {selected.payload?.identification?.publicKey}
              </p>
              <p>
                <b>Business Reg No:</b>{" "}
                {selected.payload?.identification?.businessRegNo}
              </p>
              <p>
                <b>Country:</b>{" "}
                {selected.payload?.identification?.countryOfIncorporation}
              </p>
              <p className="truncate">
                <b>Email:</b> {selected.payload?.contact?.email}
              </p>
              <p>
                <b>Phone:</b> {selected.payload?.contact?.phone}
              </p>
              <p>
                <b>Address:</b> {selected.payload?.contact?.address}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
