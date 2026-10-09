import { createClient } from "@/lib/supabase/client";

// Uploads an image to the public "media" bucket and returns its URL.
export async function uploadImage(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Images must be under 10 MB.");

  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
  });
  if (error) throw new Error(error.message);
  return supabase.storage.from("media").getPublicUrl(path).data.publicUrl;
}
