"use client";

import { OrderWithOrderItemType, PaymentChannelType } from "@/utils/types";
import { Box, Container, rem, Stack } from "@mantine/core";
import FulfillmentSection from "./Sections/FulfillmentSection";
import HeaderSection from "./Sections/HeaderSection";
import OrderItemSection from "./Sections/OrderItemSection/OrderItemSection";
import PaymentBreakdownSection from "./Sections/PaymentBreakdownSection/PaymentBreakdownSection";
import StatusSection from "./Sections/StatusSection";

type Props = {
  order: OrderWithOrderItemType;
  paymentChannelList: PaymentChannelType[];
  approvedPaymentTotal: number;
};

const OrderDetailPage = ({ order, paymentChannelList, approvedPaymentTotal }: Props) => {
  return (
    <Box py={{ base: rem(32), md: rem(56) }}>
      <Container size="lg">
        <Stack gap="xl">
          <HeaderSection orderNumber={order.order_number} dateCreated={order.order_date_created} />

          <StatusSection order={order} />

          <FulfillmentSection
            fulfillmentType={order.order_fulfillment}
            fullName={order.order_delivery_detail_full_name}
            phoneNumber={order.order_delivery_detail_phone_number}
            street={order.order_address_street}
            barangay={order.order_address_barangay}
            city={order.order_address_city}
            province={order.order_address_province}
            region={order.order_address_region}
            postalCode={order.order_address_postal_code}
            longitude={order.order_address_longitude}
            latitude={order.order_address_latitude}
          />

          <OrderItemSection order={order} />

          <PaymentBreakdownSection
            order={order}
            paymentChannelList={paymentChannelList}
            approvedPaymentTotal={approvedPaymentTotal}
          />
        </Stack>
      </Container>
    </Box>
  );
};

export default OrderDetailPage;
