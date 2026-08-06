import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@zeyn/ui/components/table";
import { Skeleton } from "@zeyn/ui/components/skeleton";
import type { ReactNode } from "react";

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  isLoading: boolean;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  empty: ReactNode;
  skeletonRows?: number;
}

export function DataTable<T>({
  columns,
  rows,
  isLoading,
  rowKey,
  onRowClick,
  empty,
  skeletonRows = 8,
}: DataTableProps<T>) {
  if (!isLoading && (!rows || rows.length === 0)) {
    return <>{empty}</>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {columns.map(column => (
            <TableHead key={column.id} className={column.className}>
              {column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading
          ? Array.from({ length: skeletonRows }).map((_, index) => (
              <TableRow key={index}>
                {columns.map(column => (
                  <TableCell key={column.id} className={column.className}>
                    <Skeleton className='h-4 w-full rounded-none' />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : rows?.map(row => (
              <TableRow
                key={rowKey(row)}
                data-interactive={onRowClick ? "" : undefined}
                className={
                  onRowClick ? "cursor-pointer hover:bg-muted/50" : undefined
                }
                onClick={
                  onRowClick
                    ? event => {
                        const target = event.target as HTMLElement;
                        if (target.closest("[data-row-action]")) return;
                        onRowClick(row);
                      }
                    : undefined
                }
              >
                {columns.map(column => (
                  <TableCell key={column.id} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
}
