"use client";

import {
  flexRender,
  getCoreRowModel,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type TableOptions,
  type VisibilityState,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export interface DataTableState {
  sorting?: SortingState;
  columnFilters?: ColumnFiltersState;
  columnVisibility?: VisibilityState;
}

export interface DataTableProps<TData, TValue>
  extends Pick<
      TableOptions<TData>,
      "data" | "getRowId" | "getSubRows" | "manualPagination" | "pageCount"
    >,
    DataTableState {
  columns: ColumnDef<TData, TValue>[];
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  onSortingChange?: (sorting: SortingState) => void;
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
}

const defaultEmptyState = (
  <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
    No results.
  </div>
);

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  manualPagination,
  getRowId,
  getSubRows,
  renderSubComponent,
  emptyState = defaultEmptyState,
  isLoading = false,
  sorting,
  columnFilters,
  columnVisibility,
  onSortingChange,
  onColumnFiltersChange,
  onColumnVisibilityChange,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    pageCount,
    manualPagination,
    getRowId,
    getSubRows,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange,
    onColumnFiltersChange,
    onColumnVisibilityChange,
  });

  const rowModel = table.getRowModel();
  const visibleColumns = table.getVisibleLeafColumns();
  const shouldShowSkeleton = isLoading && rowModel.rows.length === 0;
  const isEmpty = !isLoading && rowModel.rows.length === 0;
  const skeletonRows = React.useMemo(() => Array.from({ length: 5 }), []);

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-lg border bg-background">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {shouldShowSkeleton ? (
              skeletonRows.map((_, rowIndex) => (
                <TableRow key={`loading-${rowIndex}`}>
                  {visibleColumns.length > 0 ? (
                    visibleColumns.map((column) => (
                      <TableCell key={`${column.id}-skeleton-${rowIndex}`}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))
                  ) : (
                    <TableCell>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : isEmpty ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  {emptyState}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() ? "selected" : undefined}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {renderSubComponent && row.getIsExpanded() ? (
                    <TableRow>
                      <TableCell colSpan={columns.length}>
                        {renderSubComponent({ row })}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
