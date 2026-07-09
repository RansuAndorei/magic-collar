import { SKIPPED_ERROR_MESSAGES } from "@/utils/constants";
import { Database } from "@/utils/database";
import {
  AttachmentBucketType,
  CarShopType,
  ErrorTableInsert,
  NotificationTableRow,
  SettingsEnum,
  UserTableInsert,
} from "@/utils/types";
import { SupabaseClient } from "@supabase/supabase-js";
import Compressor from "compressorjs";
import { v4 } from "uuid";

export const insertError = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    errorTableInsert: ErrorTableInsert;
  },
) => {
  const { errorTableInsert } = params;
  if (SKIPPED_ERROR_MESSAGES.includes(errorTableInsert.error_message)) {
    return;
  }
  const { error } = await supabaseClient.from("error_table").insert(errorTableInsert);
  if (error) throw error;
};

export const uploadFile = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    file: Blob | File;
    bucket: AttachmentBucketType;
    fileName: string;
  },
) => {
  const { file, bucket, fileName } = params;

  let compressedImage: Blob;
  if (["image/jpeg", "image/png", "image/webp"].includes(file.type.toLowerCase())) {
    compressedImage = await new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: 0.6,
        success(result) {
          resolve(result);
        },
        error(error) {
          reject(error);
        },
      });
    });
  } else {
    compressedImage = file;
  }

  const formattedFileName = `${fileName}-${v4()}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(bucket)
    .upload(formattedFileName, compressedImage, { upsert: true });
  if (uploadError) throw uploadError;

  const { data } = supabaseClient.storage.from(bucket).getPublicUrl(formattedFileName);

  return {
    fileName: formattedFileName,
    publicUrl: data.publicUrl,
  };
};

export const insertUser = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userTableInsert: UserTableInsert;
  },
) => {
  const { userTableInsert } = params;
  const { data, error } = await supabaseClient
    .from("user_table")
    .insert(userTableInsert)
    .select("*")
    .single();
  if (error) throw error;
  return data;
};

export const fetchUserProfile = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
  },
) => {
  const { userId } = params;
  const { data, error } = await supabaseClient
    .from("user_table")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const fetchTopItems = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    numberOfItem: number;
  },
) => {
  const { data, error } = await supabaseClient.rpc("fetch_top_items", { input_data: params });
  if (error) throw error;
  return data as CarShopType[];
};

export const fetchSocials = async (
  supabaseClient: SupabaseClient<Database>,
  params: { socials: SettingsEnum[] },
) => {
  const { socials } = params;
  const { data, error } = await supabaseClient
    .from("system_setting_table")
    .select("system_setting_key, system_setting_value")
    .in("system_setting_key", socials);
  if (error) throw error;

  return data.reduce(
    (acc, { system_setting_key, system_setting_value }) => {
      acc[system_setting_key] = system_setting_value;
      return acc;
    },
    {} as Record<SettingsEnum, string | null>,
  );
};

export const fetchHeaderNotifications = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
    limit: number;
  },
) => {
  const { data, error } = await supabaseClient.rpc("fetch_header_notifications", {
    input_data: params,
  });
  if (error) throw error;
  return data as {
    data: NotificationTableRow[];
    count: number;
  };
};

export const readSingleNotification = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    notificationId: string;
  },
) => {
  const { notificationId } = params;
  const { error } = await supabaseClient
    .from("notification_table")
    .update({ notification_is_read: true })
    .eq("notification_id", notificationId);
  if (error) throw error;
};

export const readAllUnreadNotifications = async (
  supabaseClient: SupabaseClient<Database>,
  params: {
    userId: string;
  },
) => {
  const { userId } = params;
  const { error } = await supabaseClient
    .from("notification_table")
    .update({ notification_is_read: true })
    .eq("notification_user_id", userId)
    .eq("notification_is_read", false);
  if (error) throw error;
};
