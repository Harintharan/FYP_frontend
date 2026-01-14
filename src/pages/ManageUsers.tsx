import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { registrationService } from "@/services/registrationService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppToast } from "@/hooks/useAppToast";
import { Loader2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function ManageUsers() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAppToast();
  const [selected, setSelected] = useState<any | null>(null);

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
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Manage Users</h1>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-3 sm:mb-4 w-full sm:w-auto">
          <TabsTrigger value="users" className="flex-1 sm:flex-none text-xs sm:text-sm">Users</TabsTrigger>
          <TabsTrigger value="pending" className="flex-1 sm:flex-none text-xs sm:text-sm">Pending</TabsTrigger>
        </TabsList>

        {/* ✅ Approved Users */}
        <TabsContent value="users">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8 sm:py-10 text-xs sm:text-sm text-muted-foreground">
              <Loader2 className="animate-spin mr-2 h-4 w-4" /> Loading users...
            </div>
          ) : users?.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {users.map((user: any) => (
                <Card key={user.id} className="shadow-sm">
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="text-sm sm:text-base">{user.reg_type}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <p className="truncate">
                      <b>ID:</b> {user.id.slice(0, 12)}...
                    </p>
                    <p>
                      <b>Tx Hash:</b> {user.tx_hash?.slice(0, 12)}...
                    </p>
                    <p>
                      <b>Created:</b>{" "}
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleView(user.id)}
                      className="text-xs h-7 sm:h-8 mt-2"
                    >
                      View
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 🕓 Pending Users */}
        <TabsContent value="pending">
          {loadingPending ? (
            <div className="flex items-center justify-center py-8 sm:py-10 text-xs sm:text-sm text-muted-foreground">
              <Loader2 className="animate-spin mr-2 h-4 w-4" /> Loading pending
              requests...
            </div>
          ) : pending?.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground">
              ✅ No pending registrations.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {pending.map((item: any) => (
                <Card key={item.id} className="shadow-sm">
                  <CardHeader className="p-3 sm:p-4">
                    <CardTitle className="text-sm sm:text-base">
                      {item.reg_type}{" "}
                      <span className="text-[10px] sm:text-xs text-muted-foreground">
                        (Pending)
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <p className="truncate">
                      <b>ID:</b> {item.id.slice(0, 12)}...
                    </p>
                    <p>
                      <b>Tx Hash:</b> {item.tx_hash?.slice(0, 12)}...
                    </p>
                    <p>
                      <b>Created:</b>{" "}
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-2 sm:mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleView(item.id)}
                        className="text-xs h-7 sm:h-8"
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => approveMutation.mutate(item.id)}
                        disabled={approveMutation.isPending}
                        className="text-xs h-7 sm:h-8"
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                        ) : (
                          "Approve"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
