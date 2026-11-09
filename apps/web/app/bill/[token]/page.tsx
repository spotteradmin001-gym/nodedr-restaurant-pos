"use client";

import { ReceiptText } from "lucide-react";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { BillView, type PublicBillResponse } from "@/components/order/bill-view";
import { api, ApiError } from "@/lib/api";

// The guest-facing page a bill-share QR/link opens — see
// OrdersController.createBillShare and bill-share-dialog.tsx. No login, same
// as the table-QR menu: the opaque token in the URL is the only credential,
// and it only ever resolves to this one order (see PublicBillService).
export default function PublicBillPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-bill", token],
    queryFn: () => api.get<PublicBillResponse>(`/public/bill/${token}`),
    retry: false,
  });

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background px-6 text-center">
        <ReceiptText className="h-10 w-10 text-muted-foreground" />
        <p className="text-lg font-medium text-foreground">This bill link is not available</p>
        <p className="text-sm text-muted-foreground">
          {error instanceof ApiError
            ? error.message
            : "Ask the restaurant staff to share the bill again."}
        </p>
      </div>
    );
  }

  const order = data?.order;

  return (
    <div className="min-h-screen bg-background pb-10 print:bg-white">
      <header className="border-b border-border px-5 py-6 text-center print:border-none">
        {isLoading ? (
          <Skeleton className="mx-auto h-7 w-40" />
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {data?.restaurantName}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {data?.branch.name}
              {data?.branch.address ? ` · ${data.branch.address}` : ""}
            </p>
          </>
        )}
      </header>

      <main className="mx-auto max-w-lg px-5 py-6">
        {isLoading || !order ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-xl" />
            ))}
          </div>
        ) : (
          <BillView data={data} />
        )}
      </main>
    </div>
  );
}
