"use client";

import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { buildUpiUri } from "@/lib/upi";

export interface PublicBillItem {
  nameSnapshot: string;
  quantity: number;
  unitPriceSnapshot: number;
  lineTotal: number;
  modifiers: { nameSnapshot: string; priceAdjSnapshot: number }[];
}

export interface PublicBillResponse {
  restaurantName: string;
  currency: string;
  branch: { name: string; address: string | null; phone: string | null };
  order: {
    orderNumber: string;
    type: string;
    createdAt: string;
    table: { label: string } | null;
    customer: { name: string } | null;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    tipAmount: number;
    loyaltyDiscountAmount: number;
    totalAmount: number;
    isProvisional: boolean;
    amountPaid: number;
    balanceDue: number;
    items: PublicBillItem[];
    payments: { method: string; amount: number }[];
  };
  upi: { vpa: string; payeeName: string } | null;
}

// Shared by the guest bill-share page (app/bill/[token]) and the table-QR
// order page's auto "bill ready" view (app/order/[qrToken]) — both render the
// exact same itemized breakdown + UPI prompt, just reached different ways.
export function BillView({
  data,
  footer,
}: {
  data: PublicBillResponse;
  /** Extra actions below the bill — e.g. the order page's "Call staff" button. */
  footer?: React.ReactNode;
}) {
  const order = data.order;
  const upiUri =
    data.upi && order.balanceDue > 0
      ? buildUpiUri({
          vpa: data.upi.vpa,
          name: data.upi.payeeName,
          amount: order.balanceDue,
          note: `Order ${order.orderNumber}`,
        })
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between rounded-2xl border border-border p-4">
        <div>
          <p className="text-sm font-medium text-foreground">Order #{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleString()}
            {order.table ? ` · ${order.table.label}` : ""}
          </p>
        </div>
        <span
          className={
            order.isProvisional
              ? "rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
              : "rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success"
          }
        >
          {order.isProvisional ? "Payment pending" : "Paid"}
        </span>
      </div>

      <div className="rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted-foreground">
              <th className="px-4 py-2 text-left">Item</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-b border-border last:border-none">
                <td className="px-4 py-2 text-foreground">
                  {item.nameSnapshot}
                  {item.modifiers.map((m) => (
                    <div key={m.nameSnapshot} className="text-xs text-muted-foreground">
                      + {m.nameSnapshot}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                  {item.quantity}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-foreground">
                  {formatCurrency(item.lineTotal, data.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-1.5 rounded-2xl border border-border p-4 text-sm">
        <Row label="Subtotal" value={formatCurrency(order.subtotal, data.currency)} />
        {order.discountAmount > 0 && (
          <Row label="Discount" value={`- ${formatCurrency(order.discountAmount, data.currency)}`} />
        )}
        {order.taxAmount > 0 && (
          <Row label="Tax (incl.)" value={formatCurrency(order.taxAmount, data.currency)} />
        )}
        {order.loyaltyDiscountAmount > 0 && (
          <Row
            label="Loyalty"
            value={`- ${formatCurrency(order.loyaltyDiscountAmount, data.currency)}`}
          />
        )}
        {order.tipAmount > 0 && (
          <Row label="Tip" value={formatCurrency(order.tipAmount, data.currency)} />
        )}
        <div className="my-1 border-t border-border" />
        <Row
          label={order.isProvisional ? "Total due" : "Grand total"}
          value={formatCurrency(order.totalAmount, data.currency)}
          strong
        />
        {order.amountPaid > 0 && (
          <>
            <Row label="Paid" value={formatCurrency(order.amountPaid, data.currency)} />
            <Row label="Balance due" value={formatCurrency(order.balanceDue, data.currency)} strong />
          </>
        )}
      </div>

      {upiUri && (
        <a
          href={upiUri}
          className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground print:hidden"
        >
          <Receipt className="h-4 w-4" />
          Pay {formatCurrency(order.balanceDue, data.currency)} via UPI
        </a>
      )}

      {footer}

      <Button variant="outline" className="h-11 print:hidden" onClick={() => window.print()}>
        Print / Save as PDF
      </Button>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={
        strong
          ? "flex items-center justify-between text-base font-semibold text-foreground"
          : "flex items-center justify-between text-muted-foreground"
      }
    >
      <span>{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  );
}
