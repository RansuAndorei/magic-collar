import { FETCH_OPTION_LIMIT } from "@/utils/constants";
import { Database } from "@/utils/database";
import {
  AdminCarCatalogSortAccessor,
  AdminCatalogCar,
  AdminMagicCollarCatalogSortAccessor,
  AttachmentTableInsert,
  ConnectedCarType,
  MagicCollarTableInsert,
  MagicCollarTableUpdate,
  OptionType,
} from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

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
    sortColumnAccessor: AdminCarCatalogSortAccessor;
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
  params: {
    page: number;
    recordsPerPage: number;
    search: string;
    sortStatus: {
      columnAccessor: AdminMagicCollarCatalogSortAccessor;
      direction: "asc" | "desc";
    };
  },
) => {
  const { page, recordsPerPage, search, sortStatus } = params;

  const start = (page - 1) * recordsPerPage;
  const searchText = search.trim().replace(/[%_]/g, "");

  let query = supabaseClient.from("magic_collar_table").select("*", { count: "exact" });

  if (searchText && !Number.isNaN(Number(searchText))) {
    query = query.eq("magic_collar_reference_number", Number(searchText));
  }

  query = query.order(sortStatus.columnAccessor, {
    ascending: sortStatus.direction === "asc",
  });

  const { data, error, count } = await query.range(start, start + recordsPerPage - 1);
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
    isAvailable: boolean;
    adminUserId: string;
  },
) => {
  const { error } = await supabaseClient.rpc("set_catalog_car_availability", {
    input_data: params,
  });
  if (error) throw error;
};

export const deleteCatalogCar = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    carId: string;
    adminUserId: string;
  },
) => {
  const { error } = await supabaseClient.rpc("delete_catalog_car", {
    input_data: params,
  });
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
    userId: string;
  },
) => {
  const { error } = await supabaseClient.rpc("update_car", { input_data: params });
  if (error) throw error;
};

export const getAdminCatalogMagicCollarPage = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    page: number;
    recordsPerPage: number;
    search: string;
    status: boolean | null;
    sortColumnAccessor: AdminMagicCollarCatalogSortAccessor;
    sortDirection: "asc" | "desc";
  },
) => {
  const { page, recordsPerPage, search, status, sortColumnAccessor, sortDirection } = params;

  const start = (page - 1) * recordsPerPage;

  let query = supabaseClient
    .from("magic_collar_table")
    .select("*", { count: "exact" })
    .eq("magic_collar_is_disabled", false)
    .order(sortColumnAccessor, {
      ascending: sortDirection === "asc",
    })
    .order("magic_collar_reference_number", {
      ascending: true,
    })
    .range(start, start + recordsPerPage - 1);

  if (search) {
    let trimmedSearch = search.trim().toUpperCase();
    if (trimmedSearch.startsWith("MC-")) {
      trimmedSearch = trimmedSearch.slice(3);
    }
    const refNumber = Number(trimmedSearch);
    if (!Number.isNaN(refNumber)) {
      query = query.eq("magic_collar_reference_number", refNumber);
    }
  }
  if (status !== null) {
    query = query.eq("magic_collar_is_available", status);
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return {
    records: data,
    totalRecords: count ?? 0,
  };
};

export const setCatalogMagicCollarAvailability = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    magicCollarId: string;
    isAvailable: boolean;
    adminUserId: string;
  },
) => {
  const { error } = await supabaseClient.rpc("set_catalog_magic_collar_availability", {
    input_data: params,
  });
  if (error) throw error;
};

export const deleteCatalogMagicCollar = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    magicCollarId: string;
    adminUserId: string;
  },
) => {
  const { error } = await supabaseClient.rpc("delete_catalog_magic_collar", {
    input_data: params,
  });
  if (error) throw error;
};

export const checkConnectedCarToMagicCollar = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    magicCollarId: string;
  },
) => {
  const { magicCollarId } = params;
  const { count, error } = await supabaseClient
    .from("car_table")
    .select("*", { count: "exact", head: true })
    .eq("car_magic_collar_id", magicCollarId)
    .eq("car_is_disabled", false);
  if (error) throw error;
  return Boolean(count);
};

export const createMagicCollar = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    magicCollarInsert: MagicCollarTableInsert;
  },
) => {
  const { magicCollarInsert } = params;
  const { error } = await supabaseClient.from("magic_collar_table").insert(magicCollarInsert);
  if (error) throw error;
};

export const updateMagicCollar = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    magicCollarUpdate: MagicCollarTableUpdate;
    magicCollarId: string;
  },
) => {
  const { error } = await supabaseClient.rpc("update_magic_collar", { input_data: params });
  if (error) throw error;
};

export const getVisiblePageStock = async (supabaseClient: SupabaseClient<Database>) => {
  const stockList: { magic_collar_stock_quantity: number }[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabaseClient
      .from("magic_collar_table")
      .select("magic_collar_stock_quantity")
      .order("magic_collar_id", { ascending: true })
      .eq("magic_collar_is_disabled", false)
      .gt("magic_collar_stock_quantity", 0)
      .range(offset, offset + FETCH_OPTION_LIMIT - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    stockList.push(...data);
    if (data.length < FETCH_OPTION_LIMIT) break;
    offset += FETCH_OPTION_LIMIT;
  }
  return stockList.reduce((total, item) => total + item.magic_collar_stock_quantity, 0);
};

export const getConnectedCarsCount = async (
  supabaseClient: SupabaseClient<Database>,
  params: { magicCollarId: string },
) => {
  const { magicCollarId } = params;
  const { count, error } = await supabaseClient
    .from("car_table")
    .select("*", { count: "exact", head: true })
    .eq("car_is_disabled", false)
    .eq("car_magic_collar_id", magicCollarId);
  if (error) throw error;
  return count ?? 0;
};

export const getConnectedCars = async (
  supabaseClient: SupabaseClient<Database>,
  params: { magicCollarId: string },
) => {
  const { data, error } = await supabaseClient.rpc("get_connected_cars", { input_data: params });
  if (error) throw error;
  return data as ConnectedCarType[];
};
