import { Database } from "@/utils/database";
import {
  AdminCourierSortAccessor,
  CourierTableInsert,
  CourierTableRow,
  CourierTableUpdate,
} from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";

export const getAdminCouriersPage = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    page: number;
    recordsPerPage: number;
    search: string;
    status: boolean | null;
    sortColumnAccessor: AdminCourierSortAccessor;
    sortDirection: "asc" | "desc";
  },
) => {
  const { data, error } = await supabaseClient.rpc("get_admin_couriers_page", {
    input_data: params,
  });
  if (error) throw error;
  return data as { records: CourierTableRow[]; totalRecords: number };
};

export const createCourier = async (
  supabaseClient: SupabaseClient<Database>,
  params: { courierInsert: CourierTableInsert },
) => {
  const { data, error } = await supabaseClient.rpc("create_courier", {
    input_data: params,
  });
  if (error) throw error;
  return data as { courierId: string };
};

export const updateCourier = async (
  supabaseClient: SupabaseClient<Database>,
  params: { courierId: string; courierUpdate: CourierTableUpdate },
) => {
  const { error } = await supabaseClient.rpc("update_courier", {
    input_data: params,
  });
  if (error) throw error;
};

export const setCourierAvailability = async (
  supabaseClient: SupabaseClient<Database>,
  params: { courierId: string; isAvailable: boolean; adminUserId: string },
) => {
  const { error } = await supabaseClient.rpc("set_courier_availability", {
    input_data: params,
  });
  if (error) throw error;
};

export const deleteCourier = async (
  supabaseClient: SupabaseClient<Database>,
  params: { courierId: string; adminUserId: string },
) => {
  const { error } = await supabaseClient.rpc("delete_courier", {
    input_data: params,
  });
  if (error) throw error;
};

export const checkCourierCount = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    courierId: string;
  },
) => {
  const { courierId } = params;
  const { count, error } = await supabaseClient
    .from("courier_table")
    .select("*", { count: "exact", head: true })
    .neq("courier_id", courierId)
    .eq("courier_is_available", true)
    .eq("courier_is_disabled", false);
  if (error) throw error;
  return Boolean(count);
};
