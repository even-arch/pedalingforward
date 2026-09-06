import { getAdminPassword } from "@/lib/admin";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { password } = body as { password?: string };

  if (!password) {
    return Response.json({ error: "Password required" }, { status: 400 });
  }

  const correct = await getAdminPassword();
  if (!correct) {
    return Response.json({ error: "Admin password not configured" }, { status: 503 });
  }

  if (password !== correct) {
    return Response.json({ error: "Invalid password" }, { status: 401 });
  }

  return Response.json({ ok: true });
}
