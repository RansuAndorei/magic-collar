import { AdminOrder, AdminOrderSortAccessor, AdminSortStatus } from "@/utils/types";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { memo } from "react";

type Props = {
  records: AdminOrder[];
  totalRecords: number;
  recordsPerPage: number;
  recordsPerPageOptions: number[];
  page: number;
  fetching: boolean;
  sortStatus: AdminSortStatus<AdminOrderSortAccessor>;
  columns: DataTableColumn<AdminOrder>[];
  onPageChange: (page: number) => void;
  onRecordsPerPageChange: (value: number) => void;
  onSortStatusChange: (sortStatus: { columnAccessor: string; direction: "asc" | "desc" }) => void;
};

const AdminOrderTable = ({
  records,
  totalRecords,
  recordsPerPage,
  recordsPerPageOptions,
  page,
  fetching,
  sortStatus,
  columns,
  onPageChange,
  onRecordsPerPageChange,
  onSortStatusChange,
}: Props) => {
  return (
    <DataTable
      idAccessor="order_id"
      withTableBorder
      borderRadius="md"
      minHeight={420}
      highlightOnHover
      fetching={fetching}
      records={records}
      totalRecords={totalRecords}
      recordsPerPage={recordsPerPage}
      recordsPerPageOptions={recordsPerPageOptions}
      page={page}
      onPageChange={onPageChange}
      onRecordsPerPageChange={onRecordsPerPageChange}
      sortStatus={sortStatus}
      onSortStatusChange={onSortStatusChange}
      noRecordsText="No orders found"
      scrollAreaProps={{ type: "auto" }}
      columns={columns}
    />
  );
};

export default memo(AdminOrderTable);
