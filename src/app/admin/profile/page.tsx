"use client";

import { useState } from "react";
import { useStaff } from "@/components/admin/AdminShell";
import { Avatar } from "@/components/Avatar";
import { updateProfile, uploadImage } from "@/lib/admin";

export default function ProfilePage() {
  const { profile, reloadProfile } = useStaff();
  const [avatar, setAvatar] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ error?: string; message?: string }>({});

  return (
    <>
      <div className="admin-header">
        <h1>My profile</h1>
      </div>
      <p className="muted">This is shown next to your posts and on your public profile page.</p>
      <form
        className="panel profile-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setBusy(true);
          try {
            await updateProfile(profile.id, {
              display_name: String(f.get("display_name") || "").trim() || (profile.display_name ?? ""),
              bio: String(f.get("bio") || "").trim(),
              avatar_url: avatar,
            });
            setNote({ message: "Profile saved." });
            reloadProfile();
          } catch (err) {
            setNote({ error: (err as Error).message });
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="avatar-row">
          <Avatar name={profile.display_name} url={avatar} size={72} />
          <label className="btn">
            {uploading ? "Uploading…" : avatar ? "Change photo" : "Add a photo"}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setUploading(true);
                try {
                  setAvatar(await uploadImage(file));
                } catch (err) {
                  setNote({ error: (err as Error).message });
                } finally {
                  setUploading(false);
                }
              }}
            />
          </label>
          {avatar && (
            <button type="button" className="link-button danger" onClick={() => setAvatar(null)}>
              Remove
            </button>
          )}
        </div>
        <label className="field">
          Name
          <input name="display_name" defaultValue={profile.display_name ?? ""} required />
        </label>
        <label className="field">
          Short bio
          <textarea name="bio" defaultValue={profile.bio} rows={4} placeholder="A sentence or two about you" />
        </label>
        {note.error && <p className="form-error">{note.error}</p>}
        {note.message && <p className="form-message">{note.message}</p>}
        <div>
          <button className="btn btn-primary" disabled={busy || uploading}>
            Save profile
          </button>
        </div>
      </form>
    </>
  );
}
