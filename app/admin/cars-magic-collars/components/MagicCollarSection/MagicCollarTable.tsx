import {
  AdminMagicCollarCatalogSortAccessor,
  AdminSortStatus,
  MagicCollarTableRow,
} from "@/utils/types";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { memo } from "react";

type Props = {
  records: MagicCollarTableRow[];
  totalRecords: number;
  recordsPerPage: number;
  recordsPerPageOptions: number[];
  page: number;
  fetching: boolean;
  sortStatus: AdminSortStatus<AdminMagicCollarCatalogSortAccessor>;
  columns: DataTableColumn<MagicCollarTableRow>[];
  onPageChange: (page: number) => void;
  onRecordsPerPageChange: (value: number) => void;
  onSortStatusChange: (sortStatus: { columnAccessor: string; direction: "asc" | "desc" }) => void;
};

const MagicCollarTable = ({
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
      idAccessor="magic_collar_id"
      withTableBorder
      borderRadius="md"
      minHeight={360}
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
      noRecordsText="No magic collar records found"
      scrollAreaProps={{ type: "auto" }}
      columns={columns}
    />
  );
};

export default memo(MagicCollarTable);
