import { FETCH_OPTION_LIMIT } from "@/utils/constants";
import { Database } from "@/utils/database";
import {
  AdminCatalogCar,
  AdminCatalogSortAccessor,
  AttachmentTableInsert,
  MagicCollarSortAccessor,
  OptionType,
} from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

const CATALOG_PATH = "/admin/cars-magic-collars";

export type AdminSortStatus<TAccessor extends string> = {
  columnAccessor: TAccessor;
  direction: "asc" | "desc";
};

export type AdminPaginationParams<TAccessor extends string> = {
  page: number;
  recordsPerPage: number;
  search: string;
  sortStatus: AdminSortStatus<TAccessor>;
};

export type AdminPaginatedResult<TRecord> = {
  records: TRecord[];
  totalRecords: number;
};

export type AdminCatalogFormValues = {
  carId?: string;
  magicCollarId?: string;
  attachmentId?: string;
  makeId: string;
  modelId: string;
  modelCode: string;
  yearStart: number;
  yearEnd: number | null;
  imageName: string;
  imageUrl: string;
  price: number;
  downPaymentPrice: number;
  frontQuantity: number | null;
  rearQuantity: number | null;
  allQuantity: number | null;
  stockQuantity: number;
  isAvailable: boolean;
};

export type AdminMutationResult = {
  success: boolean;
  message: string;
};

const getRange = (page: number, recordsPerPage: number) => {
  const from = (page - 1) * recordsPerPage;
  return { from, to: from + recordsPerPage - 1 };
};

const getSearchText = (search: string) => search.trim().replace(/[%_]/g, "");

export const getCarTotalCount = async (supabaseClient: SupabaseClient<Database>) => {
  const { count, error } = await supabaseClient
    .from("car_table")
    .select("*", { count: "exact", head: true })
    .eq("car_is_disabled", false);
  if (error) throw error;
  return count ?? 0;
};

export const getMagicCollarTotalCount = async (supabaseClient: SupabaseClient<Database>) => {
  const { count, error } = await supabaseClient
    .from("magic_collar_table")
    .select("*", { count: "exact", head: true })
    .eq("magic_collar_is_disabled", false);
  if (error) throw error;
  return count ?? 0;
};

export const getAdminMakeOptions = async (supabaseClient: SupabaseClient<Database>) => {
  const makeList: OptionType[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabaseClient
      .from("make_table")
      .select("value: make_id, label: make")
      .eq("make_is_disabled", false)
      .order("make", { ascending: true })
      .range(offset, offset + FETCH_OPTION_LIMIT - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    makeList.push(...data);
    if (data.length < FETCH_OPTION_LIMIT) break;
    offset += FETCH_OPTION_LIMIT;
  }
  return makeList;
};

export const getAdminModelOptions = async (supabaseClient: SupabaseClient<Database>) => {
  const modelList: { label: string; makeId: string }[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabaseClient
      .from("model_table")
      .select("label: model, makeId: model_make_id")
      .eq("model_is_disabled", false)
      .order("model", { ascending: true })
      .range(offset, offset + FETCH_OPTION_LIMIT - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    modelList.push(...data);
    if (data.length < FETCH_OPTION_LIMIT) break;
    offset += FETCH_OPTION_LIMIT;
  }
  return modelList;
};

export const getAdminCatalogCarsPage = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    page: number;
    recordsPerPage: number;
    search: string;
    status: boolean | null;
    sortColumnAccessor: AdminCatalogSortAccessor;
    sortDirection: "asc" | "desc";
  },
) => {
  const { data, error } = await supabaseClient.rpc("get_admin_catalog_cars_page", {
    input_data: params,
  });
  if (error) throw error;
  return data as {
    records: AdminCatalogCar[];
    totalRecords: number;
  };
};

export const getMagicCollarsPage = async (
  supabaseClient: SupabaseClient<Database>,
  params: AdminPaginationParams<MagicCollarSortAccessor>,
) => {
  const { from, to } = getRange(params.page, params.recordsPerPage);
  const searchText = getSearchText(params.search);

  let query = supabaseClient.from("magic_collar_table").select("*", { count: "exact" });

  if (searchText && !Number.isNaN(Number(searchText))) {
    query = query.eq("magic_collar_reference_number", Number(searchText));
  }

  query = query.order(params.sortStatus.columnAccessor, {
    ascending: params.sortStatus.direction === "asc",
  });

  const { data, error, count } = await query.range(from, to);
  if (error) throw error;

  return {
    records: data ?? [],
    totalRecords: count ?? 0,
  };
};

export const setCatalogCarAvailability = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    carId: string;
    magicCollarId: string;
    isAvailable: boolean;
  },
) => {
  const { carId, magicCollarId, isAvailable } = params;

  const [carResult, collarResult] = await Promise.all([
    supabaseClient.from("car_table").update({ car_is_available: isAvailable }).eq("car_id", carId),
    supabaseClient
      .from("magic_collar_table")
      .update({ magic_collar_is_available: isAvailable })
      .eq("magic_collar_id", magicCollarId),
  ]);

  if (carResult.error) return { success: false, message: carResult.error.message };
  if (collarResult.error) return { success: false, message: collarResult.error.message };
};

export const deleteCatalogCar = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    carId: string;
  },
) => {
  const { carId } = params;
  const { error } = await supabaseClient
    .from("car_table")
    .update({ car_is_disabled: true })
    .eq("car_id", carId);
  if (error) throw error;
};

export const getMagicCollarByReferenceNumber = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    referenceNumber: number;
  },
) => {
  const { referenceNumber } = params;
  const { data, error } = await supabaseClient
    .from("magic_collar_table")
    .select("*")
    .eq("magic_collar_reference_number", referenceNumber)
    .eq("magic_collar_is_disabled", false)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const createCar = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    make: string;
    model: string;
    modelCode: string | null;
    yearStart: number;
    yearEnd: number | null;
    magicCollarId: string;
    isAvailable: boolean;
    userId: string;
    attachmentData: AttachmentTableInsert;
  },
) => {
  const { error } = await supabaseClient.rpc("create_car", { input_data: params });
  if (error) throw error;
};

export const updateCar = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    carId: string;
    make: string;
    model: string;
    modelCode: string | null;
    yearStart: number;
    yearEnd: number | null;
    magicCollarId: string;
    isAvailable: boolean;
    attachmentData?: AttachmentTableInsert;
  },
) => {
  const { error } = await supabaseClient.rpc("update_car", { input_data: params });
  if (error) throw error;
};
