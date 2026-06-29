import { AdminBatch, AdminBatchSortAccessor, AdminSortStatus } from "@/utils/types";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { memo } from "react";

type Props = {
  records: AdminBatch[];
  totalRecords: number;
  recordsPerPage: number;
  recordsPerPageOptions: number[];
  page: number;
  fetching: boolean;
  sortStatus: AdminSortStatus<AdminBatchSortAccessor>;
  columns: DataTableColumn<AdminBatch>[];
  onPageChange: (page: number) => void;
  onRecordsPerPageChange: (value: number) => void;
  onSortStatusChange: (sortStatus: { columnAccessor: string; direction: "asc" | "desc" }) => void;
};

const AdminBatchTable = ({
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
      idAccessor="batch_id"
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
      noRecordsText="No batches found"
      scrollAreaProps={{ type: "auto" }}
      columns={columns}
    />
  );
};

export default memo(AdminBatchTable);
