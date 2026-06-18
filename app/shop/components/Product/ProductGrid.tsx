import { CarShopType } from "@/utils/types";
import { SimpleGrid } from "@mantine/core";
import { memo } from "react";
import ProductCard from "./ProductCard";

type Props = {
  products: CarShopType[];
  onView: (product: CarShopType) => void;
};

const ProductGrid = ({ products, onView }: Props) => {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
      {products.map((product) => (
        <ProductCard key={product.car_id} product={product} onView={onView} />
      ))}
    </SimpleGrid>
  );
};

export default memo(ProductGrid);
