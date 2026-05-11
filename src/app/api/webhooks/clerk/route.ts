import { Webhook } from "svix";
import { headers } from "next/headers";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!SECRET) {
    return new Response("CLERK_WEBHOOK_SECRET não configurado", { status: 500 });
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Headers svix ausentes", { status: 400 });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;
  try {
    evt = new Webhook(SECRET).verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch {
    return new Response("Verificação falhou", { status: 400 });
  }

  if (evt.type === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address;
    const name =
      [first_name, last_name].filter(Boolean).join(" ") ||
      email?.split("@")[0] ||
      "Usuário";
    await prisma.user.upsert({
      where: { id },
      update: { email: email!, name, avatarUrl: image_url },
      create: { id, email: email!, name, avatarUrl: image_url, role: null },
    });
  }

  if (evt.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;
    const email = email_addresses[0]?.email_address;
    const name = [first_name, last_name].filter(Boolean).join(" ");
    await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(name && { name }),
        ...(image_url && { avatarUrl: image_url }),
      },
    });
  }

  if (evt.type === "user.deleted") {
    const { id } = evt.data;
    if (id) await prisma.user.delete({ where: { id } }).catch(() => null);
  }

  return new Response("ok", { status: 200 });
}
