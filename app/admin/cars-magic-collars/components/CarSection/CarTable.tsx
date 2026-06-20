import { AdminCatalogCar, AdminCatalogSortAccessor } from "@/utils/types";
import { DataTable, DataTableColumn } from "mantine-datatable";
import { memo } from "react";
import { AdminSortStatus } from "../../actions";

type Props = {
  records: AdminCatalogCar[];
  totalRecords: number;
  recordsPerPage: number;
  recordsPerPageOptions: number[];
  page: number;
  fetching: boolean;
  sortStatus: AdminSortStatus<AdminCatalogSortAccessor>;
  columns: DataTableColumn<AdminCatalogCar>[];
  onPageChange: (page: number) => void;
  onRecordsPerPageChange: (value: number) => void;
  onSortStatusChange: (sortStatus: { columnAccessor: string; direction: "asc" | "desc" }) => void;
};

const CarTable = ({
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
      idAccessor="car_id"
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
      noRecordsText="No car records found"
      scrollAreaProps={{ type: "auto" }}
      columns={columns}
    />
  );
};

export default memo(CarTable);
