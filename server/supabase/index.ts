import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_supabase_url as string,
  process.env.NEXT_PUBLIC_supabase_key as string
);

export const getImageUrl = (path: string) => {
  return supabase.storage.from("slipstorage/buffalo").getPublicUrl(path).data
    .publicUrl;
};
