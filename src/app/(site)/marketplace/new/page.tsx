"use client";

import Link from "next/link";
import { useState } from "react";
import { addListing, uploadImage } from "@/lib/admin";
import { listingKinds, type ListingKind } from "@/lib/types";
import { useSession } from "@/lib/useSession";

export default function NewListingPage() {
  const session = useSession();
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (session.status === "loading") return null;
  if (session.status === "signed-out") {
    return (
      <div className="big-note">
        <p>You need to be a member to post.</p>
        <Link href="/admin/?join=1" className="btn btn-primary btn-big">
          Join
        </Link>
      </div>
    );
  }
  const userId = session.profile!.id;

  if (done) {
    return (
      <div className="market-done">
        <h1 className="page-heading">thanks!</h1>
        <p className="big-note">Your post will appear in the marketplace once an editor approves it.</p>
        <Link href="/marketplace/" className="btn btn-big">
          Back to the marketplace
        </Link>
      </div>
    );
  }

  return (
    <form
      className="listing-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        try {
          await addListing(userId, {
            kind: String(f.get("kind")),
            title: String(f.get("title") || "").trim(),
            body: String(f.get("body") || "").trim(),
            price: String(f.get("price") || "").trim(),
            location: String(f.get("location") || "").trim(),
            contact: String(f.get("contact") || "").trim(),
            image_url: image,
          });
          setDone(true);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1 className="page-heading">post something</h1>
      <label>
        What is it?
        <select name="kind" defaultValue="for-sale">
          {(Object.keys(listingKinds) as ListingKind[]).map((k) => (
            <option key={k} value={k}>
              {listingKinds[k]}
            </option>
          ))}
        </select>
      </label>
      <label>
        Title
        <input name="title" required maxLength={140} placeholder="e.g. Sublet in Mokotów, all of March" />
      </label>
      <label>
        Details
        <textarea name="body" rows={5} maxLength={4000} />
      </label>
      <div className="listing-form-row">
        <label>
          Price
          <input name="price" maxLength={60} placeholder="e.g. 200 zł, free, 10% off" />
        </label>
        <label>
          Where
          <input name="location" maxLength={80} placeholder="e.g. Warsaw, Rio de Janeiro" />
        </label>
      </div>
      <label>
        How to reach you
        <input name="contact" maxLength={120} placeholder="email, phone or Instagram — this will be public" />
      </label>
      <label className="btn listing-photo">
        {uploading ? "Uploading…" : image ? "Change photo" : "Add a photo"}
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
              setImage(await uploadImage(file));
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setUploading(false);
            }
          }}
        />
      </label>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="listing-preview" />
      )}
      {error && <p className="form-error">{error}</p>}
      <button className="btn btn-primary btn-big" disabled={busy || uploading}>
        Send for approval
      </button>
    </form>
  );
}
