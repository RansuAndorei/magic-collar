import { getSetContents } from "@/utils/functions";
import { CarShopType } from "@/utils/types";
import { Badge } from "@mantine/core";

type Props = {
  product: CarShopType;
};

const SetContentsLabel = ({ product }: Props) => {
  const {
    car_magic_collar: {
      magic_collar_front_quantity,
      magic_collar_rear_quantity,
      magic_collar_all_quantity,
    },
  } = product;

  return (
    <Badge color="red" variant="dot" size="xs">
      {getSetContents(
        magic_collar_front_quantity,
        magic_collar_rear_quantity,
        magic_collar_all_quantity,
      )}{" "}
      per set
    </Badge>
  );
};

export default SetContentsLabel;
