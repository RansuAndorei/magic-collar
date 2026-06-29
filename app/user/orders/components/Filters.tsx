import { ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/utils/constants";
import { OrderPaymentStatusEnum, OrderStatusEnum } from "@/utils/types";
import { Grid, Select, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { Dispatch, SetStateAction } from "react";

type Props = {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  setPage: Dispatch<SetStateAction<number>>;
  orderStatus: string;
  setOrderStatus: Dispatch<SetStateAction<OrderStatusEnum | "ALL">>;
  paymentStatus: OrderPaymentStatusEnum | "ALL";
  setPaymentStatus: Dispatch<SetStateAction<OrderPaymentStatusEnum | "ALL">>;
};

const Filters = ({
  search,
  setSearch,
  setPage,
  orderStatus,
  setOrderStatus,
  paymentStatus,
  setPaymentStatus,
}: Props) => {
  return (
    <Grid>
      <Grid.Col span={{ base: 12, md: 6 }}>
        <TextInput
          placeholder="Search order number, make, model, or model code"
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(event) => {
            setSearch(event.currentTarget.value);
            setPage(1);
          }}
          label="Search"
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 3 }}>
        <Select
          data={ORDER_STATUS_OPTIONS}
          value={orderStatus}
          onChange={(value) => {
            setOrderStatus((value as OrderStatusEnum | "ALL") ?? "ALL");
            setPage(1);
          }}
          label="Order Status"
        />
      </Grid.Col>

      <Grid.Col span={{ base: 12, md: 3 }}>
        <Select
          data={PAYMENT_STATUS_OPTIONS}
          value={paymentStatus}
          onChange={(value) => {
            setPaymentStatus((value as OrderPaymentStatusEnum | "ALL") ?? "ALL");
            setPage(1);
          }}
          label="Payment Status"
        />
      </Grid.Col>
    </Grid>
  );
};

export default Filters;
