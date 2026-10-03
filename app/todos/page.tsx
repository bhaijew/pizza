import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

  return (
    <div style={{ padding: "32px", fontFamily: "sans-serif" }}>
      <h1>Supabase Todos Test Page</h1>
      <ul>
        {todos?.map((todo: { id: string | number; name: string }) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
      {(!todos || todos.length === 0) && (
        <p>No todos found (or &apos;todos&apos; table does not exist in your database).</p>
      )}
    </div>
  );
}
