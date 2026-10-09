import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import type { Profile } from "@/lib/types";
import { setRole } from "../../actions";

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (me?.role !== "admin") redirect("/admin");

  const { data } = await supabase.from("profiles").select("*").order("created_at");
  const people = (data ?? []) as Profile[];

  return (
    <>
      <div className="admin-header">
        <h1>Team</h1>
      </div>
      <p className="muted">
        New writers create an account from the staff login page, then appear here as <em>pending</em>. Make them an
        editor to let them write and publish.
      </p>
      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Joined</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id}>
                <td>{p.display_name}</td>
                <td>{p.email}</td>
                <td className="muted">{formatDate(p.created_at)}</td>
                <td>
                  {p.id === user!.id ? (
                    <span className="tag tag-published">{p.role} (you)</span>
                  ) : (
                    <form action={setRole} className="role-form">
                      <input type="hidden" name="id" value={p.id} />
                      {(["pending", "editor", "admin"] as const).map((r) => (
                        <button key={r} name="role" value={r} className={`chip ${p.role === r ? "chip-on" : ""}`}>
                          {r}
                        </button>
                      ))}
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
