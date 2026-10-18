"use client";

import { useStaff } from "@/components/admin/AdminShell";
import { ErrorNote, Loading } from "@/components/States";
import { setRole } from "@/lib/admin";
import { formatDate } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/lib/types";
import { useQuery } from "@/lib/useQuery";

async function fetchProfiles() {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at");
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export default function TeamPage() {
  const { user, profile } = useStaff();
  const { data: people, error, loading, reload } = useQuery(fetchProfiles, []);

  if (profile.role !== "admin") return <p className="muted">Only admins can manage the team.</p>;

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
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorNote error={error} />
        ) : (
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
              {people?.map((p) => (
                <tr key={p.id}>
                  <td>{p.display_name}</td>
                  <td>{p.email}</td>
                  <td className="muted">{formatDate(p.created_at)}</td>
                  <td>
                    {p.id === user.id ? (
                      <span className="tag tag-published">{p.role} (you)</span>
                    ) : (
                      <div className="role-form">
                        {(["pending", "editor", "admin"] as const).map((r) => (
                          <button
                            key={r}
                            className={`chip ${p.role === r ? "chip-on" : ""}`}
                            onClick={async () => {
                              try {
                                await setRole(p.id, r);
                                reload();
                              } catch (err) {
                                alert((err as Error).message);
                              }
                            }}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
