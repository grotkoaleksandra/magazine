import { getCategories } from "@/lib/articles";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteCategory } from "../../actions";
import { CategoryForm } from "./CategoryForm";

export default async function CategoriesPage() {
  const categories = await getCategories();
  return (
    <>
      <div className="admin-header">
        <h1>Sections</h1>
      </div>
      <p className="muted">Sections appear in the navigation bar of the magazine.</p>
      <div className="panel">
        <CategoryForm />
        <ul className="list">
          {categories.map((c) => (
            <li key={c.id}>
              <span>
                {c.name} <span className="muted">/category/{c.slug}</span>
              </span>
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={c.id} />
                <ConfirmButton message={`Delete the “${c.name}” section? Its articles will be kept.`} className="link-button danger">
                  Delete
                </ConfirmButton>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
