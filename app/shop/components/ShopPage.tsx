"use client";

import {
  CHECKOUT_ID_STORAGE_KEY,
  MAX_QUANTITY,
  SHOP_CART_STORAGE_KEY,
  SHOP_PAGE_SIZE,
  SHOP_PREFERENCES_STORAGE_KEY,
  SHOP_SORT_OPTIONS,
  YEAR_OPTIONS,
} from "@/utils/constants";
import { getProductTitle, parseStoredCart } from "@/utils/functions";
import { supabaseClient } from "@/utils/supabase/client";
import { CarShopType, CartItemType, OptionType, ShopFiltersType } from "@/utils/types";
import {
  Autocomplete,
  Box,
  Button,
  Container,
  Flex,
  Group,
  Pagination,
  rem,
  Select,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { IconAdjustments, IconSearch, IconShoppingCart, IconX } from "@tabler/icons-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCheckoutStatus } from "../actions";
import CartDrawer from "./Drawer/CartDrawer";
import MobileFilterDrawer from "./Drawer/MobileFilterDrawer";
import ActivePill from "./Helper/ActivePill";
import EmptyState from "./Helper/EmptyState";
import ShopInitialLoading from "./Helper/ShopInitialLoading";
import ProductDetailModal from "./Product/ProductDetailModal";
import ProductGrid from "./Product/ProductGrid";

const DEFAULT_FILTERS: ShopFiltersType = {
  makeId: "",
  modelId: "",
  yearStart: "",
  yearEnd: "",
  sortBy: "newest",
};

const SORT_VALUES = new Set(SHOP_SORT_OPTIONS.map(({ value }) => value));

type ShopPreferences = {
  search: string;
  filters: ShopFiltersType;
};

export const normalizeSearch = (value: string) => value.trim().toLowerCase();

export const parseShopPreferences = (value: string | null): ShopPreferences | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<ShopPreferences>;
    const parsedFilters: Partial<ShopFiltersType> = parsed.filters ?? {};
    const sortBy =
      typeof parsedFilters.sortBy === "string" && SORT_VALUES.has(parsedFilters.sortBy)
        ? parsedFilters.sortBy
        : DEFAULT_FILTERS.sortBy;

    return {
      search: typeof parsed.search === "string" ? parsed.search : "",
      filters: {
        makeId: typeof parsedFilters.makeId === "string" ? parsedFilters.makeId : "",
        modelId: typeof parsedFilters.modelId === "string" ? parsedFilters.modelId : "",
        yearStart: typeof parsedFilters.yearStart === "string" ? parsedFilters.yearStart : "",
        yearEnd: typeof parsedFilters.yearEnd === "string" ? parsedFilters.yearEnd : "",
        sortBy,
      },
    };
  } catch {
    return null;
  }
};

type Props = {
  makeList: OptionType[];
  modelList: (OptionType & { makeId: string })[];
  carList: CarShopType[];
};

const ShopPage = ({ makeList, modelList, carList }: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 400);
  const [filters, setFilters] = useState<ShopFiltersType>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [hasLoadedPreferences, setHasLoadedPreferences] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CarShopType | null>(null);
  const [cartItems, setCartItems] = useState<CartItemType[]>([]);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [cartOpened, { open: openCart, close: closeCart }] = useDisclosure(false);
  const [productModalOpened, { open: openProductModal, close: closeProductModal }] =
    useDisclosure(false);

  useEffect(() => {
    const init = async () => {
      const checkoutId = localStorage.getItem(CHECKOUT_ID_STORAGE_KEY);
      if (checkoutId) {
        const status = await getCheckoutStatus(supabaseClient, { checkoutId });
        if (status === "PAID") {
          localStorage.removeItem(SHOP_CART_STORAGE_KEY);
          localStorage.removeItem(CHECKOUT_ID_STORAGE_KEY);
        }
      }

      // 2. now read localStorage (cart is already cleaned up if needed)
      const savedPreferences = parseShopPreferences(
        window.localStorage.getItem(SHOP_PREFERENCES_STORAGE_KEY),
      );
      const savedCart = parseStoredCart(window.localStorage.getItem(SHOP_CART_STORAGE_KEY));

      const makeParams = searchParams.get("make");
      const make = makeList.find(({ label }) => label === makeParams)?.value;

      let search = "";
      let filters: ShopFiltersType = {
        makeId: "",
        modelId: "",
        yearStart: "",
        yearEnd: "",
        sortBy: "",
      };

      if (savedPreferences) {
        search = savedPreferences.search;
        filters = savedPreferences.filters;
      }

      if (make) {
        filters = { ...filters, makeId: make, modelId: "" };

        const url = new URL(window.location.href);
        url.searchParams.delete("make");
        window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      }

      setSearch(search);
      setFilters(filters);
      setCartItems(
        savedCart.reduce<CartItemType[]>((items, storedItem) => {
          if (items.some((item) => item.product.car_id === storedItem.carId)) return items;
          const product = carList.find((car) => car.car_id === storedItem.carId);
          if (!product) return items;
          return [...items, { product, quantity: storedItem.quantity }];
        }, []),
      );
      setHasLoadedPreferences(true);
    };

    init();
  }, []);

  useEffect(() => {
    if (!hasLoadedPreferences) return;

    const saveTimeout = window.setTimeout(() => {
      window.localStorage.setItem(
        SHOP_PREFERENCES_STORAGE_KEY,
        JSON.stringify({
          search,
          filters,
        }),
      );
    }, 250);

    return () => window.clearTimeout(saveTimeout);
  }, [filters, hasLoadedPreferences, search]);

  useEffect(() => {
    if (!hasLoadedPreferences) return;

    const saveTimeout = window.setTimeout(() => {
      window.localStorage.setItem(
        SHOP_CART_STORAGE_KEY,
        JSON.stringify(
          cartItems.map(({ product, quantity }) => ({
            carId: product.car_id,
            quantity,
          })),
        ),
      );
    }, 250);

    return () => window.clearTimeout(saveTimeout);
  }, [cartItems, hasLoadedPreferences]);

  const filteredModels = useMemo(() => {
    if (!filters.makeId) return modelList;
    return modelList.filter(({ makeId }) => makeId === filters.makeId);
  }, [filters.makeId, modelList]);

  const filteredAndSortedProducts = useMemo(() => {
    const normalizedSearch = normalizeSearch(debouncedSearch);
    const yearStart = filters.yearStart ? Number(filters.yearStart) : null;
    const yearEnd = filters.yearEnd ? Number(filters.yearEnd) : null;

    const filteredProducts = carList.filter((product) => {
      if (filters.makeId && product.car_make_id !== filters.makeId) return false;
      if (filters.modelId && product.car_model_id !== filters.modelId) return false;

      if (yearStart !== null) {
        const productYearEnd = product.car_model_year_end ?? Number.MAX_SAFE_INTEGER;
        if (productYearEnd < yearStart) return false;
      }

      if (yearEnd !== null && product.car_model_year_start > yearEnd) return false;

      if (normalizedSearch) {
        const searchableText = normalizeSearch(
          [
            product.car_make,
            product.car_model,
            product.car_model_code,
            product.car_model_year_start,
            product.car_model_year_end ?? "present",
          ].join(" "),
        );

        if (!searchableText.includes(normalizedSearch)) return false;
      }

      return true;
    });

    return [...filteredProducts].sort((firstProduct, secondProduct) => {
      if (filters.sortBy === "price_asc") {
        return (
          firstProduct.car_magic_collar.magic_collar_price -
          secondProduct.car_magic_collar.magic_collar_price
        );
      }

      if (filters.sortBy === "price_desc") {
        return (
          secondProduct.car_magic_collar.magic_collar_price -
          firstProduct.car_magic_collar.magic_collar_price
        );
      }

      if (filters.sortBy === "make_asc") {
        return `${firstProduct.car_make} ${firstProduct.car_model}`.localeCompare(
          `${secondProduct.car_make} ${secondProduct.car_model}`,
        );
      }

      return (
        new Date(secondProduct.car_date_created).getTime() -
        new Date(firstProduct.car_date_created).getTime()
      );
    });
  }, [carList, debouncedSearch, filters]);

  const totalCount = filteredAndSortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / SHOP_PAGE_SIZE));
  const products = useMemo(() => {
    const start = (page - 1) * SHOP_PAGE_SIZE;
    return filteredAndSortedProducts.slice(start, start + SHOP_PAGE_SIZE);
  }, [filteredAndSortedProducts, page]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const activeFilterCount = [
    filters.makeId,
    filters.modelId,
    filters.yearStart,
    filters.yearEnd,
  ].filter(Boolean).length;
  const hasFilters = activeFilterCount > 0 || !!debouncedSearch;
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleFilterChange = (key: keyof ShopFiltersType, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setSearch("");
    setPage(1);
    closeDrawer();
  };

  const handleViewProduct = useCallback(
    (product: CarShopType) => {
      setSelectedProduct(product);
      openProductModal();
    },
    [openProductModal],
  );

  const handleAddToCart = useCallback(
    (product: CarShopType) => {
      setCartItems((currentItems) => {
        const existingItem = currentItems.find((item) => item.product.car_id === product.car_id);
        if (existingItem) {
          return currentItems.map((item) =>
            item.product.car_id === product.car_id
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          );
        }

        return [...currentItems, { product, quantity: 1 }];
      });
      closeProductModal();
      openCart();
    },
    [closeProductModal, openCart],
  );

  const handleCartQuantityChange = useCallback((carId: string, quantity: number) => {
    const nextQuantity = Math.max(1, Math.floor(quantity));
    if (nextQuantity > MAX_QUANTITY) return;
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.product.car_id === carId ? { ...item, quantity: nextQuantity } : item,
      ),
    );
  }, []);

  const handleRemoveCartItem = useCallback(
    (carId: string) => {
      const itemToRemove = cartItems.find((item) => item.product.car_id === carId);
      if (!itemToRemove) return;

      modals.openConfirmModal({
        title: "Remove item?",
        children: (
          <Text size="sm">
            Remove {getProductTitle(itemToRemove.product.car_make, itemToRemove.product.car_model)}{" "}
            from your cart?
          </Text>
        ),
        labels: { confirm: "Remove", cancel: "Keep item" },
        confirmProps: { color: "red" },
        onConfirm: () => {
          setCartItems((currentItems) =>
            currentItems.filter((item) => item.product.car_id !== carId),
          );
        },
        centered: true,
      });
    },
    [cartItems],
  );

  const handleClearCart = useCallback(() => {
    if (cartItems.length === 0) return;

    modals.openConfirmModal({
      title: "Clear cart?",
      children: (
        <Text size="sm">
          Remove all {cartItems.length} item{cartItems.length === 1 ? "" : "s"} from your cart?
        </Text>
      ),
      labels: { confirm: "Clear cart", cancel: "Keep cart" },
      confirmProps: { color: "red" },
      onConfirm: () => setCartItems([]),
      centered: true,
    });
  }, [cartItems.length]);

  const handleProceedToCheckout = useCallback(() => {
    closeCart();
    router.push("/checkout");
  }, [closeCart, router]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!hasLoadedPreferences) {
    return <ShopInitialLoading />;
  }

  return (
    <>
      <ProductDetailModal
        opened={productModalOpened}
        product={selectedProduct}
        onClose={closeProductModal}
        onAddToCart={handleAddToCart}
      />
      <CartDrawer
        opened={cartOpened}
        items={cartItems}
        onClose={closeCart}
        onQuantityChange={handleCartQuantityChange}
        onRemove={handleRemoveCartItem}
        onClear={handleClearCart}
        onCheckout={handleProceedToCheckout}
      />
      <MobileFilterDrawer
        opened={drawerOpened}
        onClose={closeDrawer}
        filters={filters}
        makes={makeList}
        models={modelList}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        activeCount={activeFilterCount}
      />

      <Box py={{ base: rem(40), md: rem(60) }}>
        <Container size="xl">
          <Stack gap="xl">
            {/* Header */}
            <Stack gap={4}>
              <Text size="sm" c="red.5" fw={700} tt="uppercase" style={{ letterSpacing: "0.1em" }}>
                Magic Collar Shop
              </Text>
              <Title order={1} style={{ fontSize: rem(34), fontWeight: 800 }}>
                Find Your Collar
              </Title>
              <Text c="dimmed" size="md">
                Search by make, model, or model code to find the exact Magic Collar for your
                vehicle.
              </Text>
            </Stack>

            {/* ── Inline filters (md+) ── */}
            <Stack gap="sm" visibleFrom="md">
              {/* Row 1: search + sort */}
              <Group gap="sm" align="flex-end">
                <TextInput
                  flex={1}
                  placeholder="Search by make, model, or model code..."
                  leftSection={<IconSearch size={16} />}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.currentTarget.value);
                    setPage(1);
                  }}
                  rightSection={
                    search ? (
                      <Box
                        component="button"
                        onClick={() => {
                          setSearch("");
                          setPage(1);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--mantine-color-dimmed)",
                          display: "flex",
                          alignItems: "center",
                          padding: 0,
                        }}
                      >
                        <IconX size={14} />
                      </Box>
                    ) : null
                  }
                />
                <Select
                  label="Sort by"
                  data={SHOP_SORT_OPTIONS}
                  value={filters.sortBy}
                  onChange={(v) => handleFilterChange("sortBy", v ?? "newest")}
                  w={200}
                />
              </Group>

              {/* Row 2: cascading filters */}
              <Group gap="sm" align="flex-end">
                <Select
                  label="Make"
                  placeholder="All makes"
                  data={makeList}
                  value={filters.makeId || null}
                  onChange={(v) => {
                    handleFilterChange("makeId", v ?? "");
                    handleFilterChange("modelId", "");
                  }}
                  clearable
                  searchable
                  style={{ flex: 1.5 }}
                />
                <Select
                  label="Model"
                  placeholder={filters.makeId ? "All models" : "Select a make first"}
                  data={filteredModels}
                  value={filters.modelId || null}
                  onChange={(v) => handleFilterChange("modelId", v ?? "")}
                  disabled={!filters.makeId}
                  clearable
                  searchable
                  style={{ flex: 1.5 }}
                />
                <Autocomplete
                  label="Year from"
                  placeholder="Any"
                  data={YEAR_OPTIONS}
                  value={filters.yearStart}
                  onChange={(v) => handleFilterChange("yearStart", v ?? "")}
                  clearable
                  style={{ flex: 1 }}
                />
                <Autocomplete
                  label="Year to"
                  placeholder="Any"
                  data={YEAR_OPTIONS}
                  value={filters.yearEnd}
                  onChange={(v) => handleFilterChange("yearEnd", v ?? "")}
                  clearable
                />
                {hasFilters && (
                  <Button
                    variant="subtle"
                    color="gray"
                    onClick={handleReset}
                    style={{ flexShrink: 0 }}
                  >
                    Clear
                  </Button>
                )}
              </Group>
            </Stack>

            {/* ── Mobile: search + filter button ── */}
            <Stack gap="sm" hiddenFrom="md">
              <Group gap="sm">
                <TextInput
                  flex={1}
                  placeholder="Search make, model..."
                  leftSection={<IconSearch size={16} />}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.currentTarget.value);
                    setPage(1);
                  }}
                  rightSection={
                    search ? (
                      <Box
                        component="button"
                        onClick={() => {
                          setSearch("");
                          setPage(1);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--mantine-color-dimmed)",
                          display: "flex",
                          alignItems: "center",
                          padding: 0,
                        }}
                      >
                        <IconX size={14} />
                      </Box>
                    ) : null
                  }
                />
                <Button
                  variant={activeFilterCount > 0 ? "filled" : "default"}
                  color={activeFilterCount > 0 ? "red" : undefined}
                  leftSection={<IconAdjustments size={16} />}
                  onClick={openDrawer}
                  style={{ flexShrink: 0 }}
                >
                  ShopFiltersType{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                </Button>
              </Group>
            </Stack>

            {/* Active filter pills */}
            {hasFilters && (
              <Group gap="xs">
                {debouncedSearch && (
                  <ActivePill
                    label={`"${debouncedSearch}"`}
                    onRemove={() => {
                      setSearch("");
                      setPage(1);
                    }}
                  />
                )}
                {filters.makeId && (
                  <ActivePill
                    label={makeList.find(({ value }) => value === filters.makeId)?.label ?? "Make"}
                    onRemove={() => {
                      handleFilterChange("makeId", "");
                      handleFilterChange("modelId", "");
                    }}
                  />
                )}
                {filters.modelId && (
                  <ActivePill
                    label={
                      modelList.find(({ value }) => value === filters.modelId)?.label ?? "Model"
                    }
                    onRemove={() => handleFilterChange("modelId", "")}
                  />
                )}
                {filters.yearStart && (
                  <ActivePill
                    label={`From ${filters.yearStart}`}
                    onRemove={() => handleFilterChange("yearStart", "")}
                  />
                )}
                {filters.yearEnd && (
                  <ActivePill
                    label={`To ${filters.yearEnd}`}
                    onRemove={() => handleFilterChange("yearEnd", "")}
                  />
                )}
              </Group>
            )}

            {/* Results count */}
            <Text size="sm" c="dimmed">
              {totalCount === 0
                ? "No products found"
                : `Showing ${(page - 1) * SHOP_PAGE_SIZE + 1}-${Math.min(page * SHOP_PAGE_SIZE, totalCount)} of ${totalCount} products`}
            </Text>

            {/* Grid */}
            {products.length === 0 ? (
              <EmptyState onReset={handleReset} hasFilters={hasFilters} />
            ) : (
              <ProductGrid products={products} onView={handleViewProduct} />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Flex justify="center">
                <Pagination
                  total={totalPages}
                  value={page}
                  onChange={handlePageChange}
                  color="red"
                  radius="md"
                />
              </Flex>
            )}
          </Stack>
        </Container>
      </Box>
      <Button
        color="red"
        size="md"
        leftSection={<IconShoppingCart size={18} />}
        onClick={openCart}
        style={{
          position: "fixed",
          right: rem(24),
          bottom: rem(24),
          zIndex: 100,
          boxShadow: "0 12px 32px rgba(0,0,0,0.28)",
        }}
      >
        Cart{cartItemCount > 0 ? ` (${cartItemCount})` : ""}
      </Button>
    </>
  );
};

export default ShopPage;
