import { checkAdminAuth } from "@/lib/admin";
import { generateCausalRules } from "@/lib/rule-gen";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!(await checkAdminAuth(req))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateCausalRules();
  if (result.error) {
    return Response.json({ ok: false, error: result.error }, { status: 400 });
  }
  return Response.json({ ok: true, generated: result.generated });
}
