"use client";

import {
  User,
  Building2,
  FolderOpen,
  MapPin,
  Tag,
  Receipt,
  Calendar,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { InputSnapshot } from "@/types/commission-trace";

interface InputSnapshotCardProps {
  snapshot: InputSnapshot;
  className?: string;
}

interface InfoRowProps {
  icon: typeof User;
  label: string;
  value?: string | number | null;
  badge?: boolean;
  badgeVariant?: "default" | "secondary" | "outline";
}

function InfoRow({
  icon: Icon,
  label,
  value,
  badge,
  badgeVariant = "outline",
}: InfoRowProps) {
  if (!value && value !== 0) return null;

  return (
    <div className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        {badge ? (
          <Badge variant={badgeVariant} className="mt-0.5">
            {value}
          </Badge>
        ) : (
          <div className="font-medium truncate">{value}</div>
        )}
      </div>
    </div>
  );
}

export function InputSnapshotCard({
  snapshot,
  className,
}: InputSnapshotCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Transaction Snapshot
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Data captured at calculation time
        </p>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Amounts */}
        <div className="grid grid-cols-2 gap-4 pb-3 border-b">
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Gross Amount
            </div>
            <div className="text-lg font-bold">
              {formatCurrency(snapshot.grossAmount)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              Net Amount
            </div>
            <div className="text-lg font-bold">
              {formatCurrency(snapshot.netAmount)}
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <InfoRow
          icon={Calendar}
          label="Transaction Date"
          value={formatDate(snapshot.transactionDate)}
        />

        <InfoRow
          icon={Receipt}
          label="Invoice Number"
          value={snapshot.invoiceNumber}
        />

        <InfoRow
          icon={Tag}
          label="Transaction Type"
          value={snapshot.transactionType}
          badge
        />

        {snapshot.description && (
          <InfoRow
            icon={Receipt}
            label="Description"
            value={snapshot.description}
          />
        )}

        {/* Divider */}
        <div className="border-t my-2" />

        {/* Related Entities */}
        {snapshot.salesperson && (
          <InfoRow
            icon={User}
            label="Salesperson"
            value={snapshot.salesperson.name}
          />
        )}

        {snapshot.client && (
          <>
            <InfoRow
              icon={Building2}
              label="Client"
              value={snapshot.client.name}
            />
            <InfoRow
              icon={Building2}
              label="Client Tier"
              value={snapshot.client.tier}
              badge
              badgeVariant="secondary"
            />
          </>
        )}

        {snapshot.project && (
          <InfoRow
            icon={FolderOpen}
            label="Project"
            value={snapshot.project.name}
          />
        )}

        {snapshot.territory && (
          <InfoRow
            icon={MapPin}
            label="Territory"
            value={snapshot.territory.name}
          />
        )}

        {snapshot.productCategory && (
          <InfoRow
            icon={Tag}
            label="Product Category"
            value={snapshot.productCategory.name}
            badge
          />
        )}

        {/* Transaction ID */}
        <div className="pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            Transaction ID:{" "}
            <code className="bg-muted px-1 rounded">
              {snapshot.transactionId}
            </code>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
