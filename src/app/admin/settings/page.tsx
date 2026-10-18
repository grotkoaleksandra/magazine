"use client";

import { useState } from "react";
import { useStaff } from "@/components/admin/AdminShell";
import { Loading } from "@/components/States";
import { uploadVideo } from "@/lib/admin";
import { fetchSettings, saveSetting } from "@/lib/settings";
import { useQuery } from "@/lib/useQuery";

export default function SettingsPage() {
  const { profile } = useStaff();
  const { data, loading, reload } = useQuery(fetchSettings, []);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ error?: string; message?: string }>({});

  if (profile.role !== "admin") return <p className="muted">Only admins can change site settings.</p>;
  if (loading) return <Loading />;
  const video = data?.hero_video_url;

  async function setVideo(url: string) {
    setBusy(true);
    try {
      await saveSetting("hero_video_url", url);
      setNote({ message: url ? "Hero video updated." : "Hero video removed." });
      reload();
    } catch (err) {
      setNote({ error: (err as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="admin-header">
        <h1>Site settings</h1>
      </div>
      <div className="panel settings-panel">
        <h2 className="panel-heading">Front-page video</h2>
        <p className="muted">
          Plays silently on a loop behind the magazine title, replacing the built-in punk montage. The title switches between light and dark text to stay
          readable over it. Use an MP4 under 50 MB; a 10–20 second clip at 1080p works well.
        </p>
        {video ? (
          <video className="settings-video" src={video} autoPlay muted loop playsInline />
        ) : (
          <p className="muted">No custom video — the front page plays the built-in punk montage. Upload a video to replace it.</p>
        )}
        <div className="inline-form">
          <label className="btn btn-primary">
            {busy ? "Uploading…" : video ? "Replace video" : "Upload video"}
            <input
              type="file"
              accept="video/mp4,video/webm"
              hidden
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setNote({});
                setBusy(true);
                try {
                  await setVideo(await uploadVideo(file));
                } catch (err) {
                  setNote({ error: (err as Error).message });
                  setBusy(false);
                }
              }}
            />
          </label>
          {video && (
            <button className="link-button danger" disabled={busy} onClick={() => setVideo("")}>
              Remove video
            </button>
          )}
        </div>
        {note.error && <p className="form-error">{note.error}</p>}
        {note.message && <p className="form-message">{note.message}</p>}
      </div>
    </>
  );
}
