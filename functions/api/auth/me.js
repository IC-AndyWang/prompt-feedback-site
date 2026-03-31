import { json } from "../_lib.js";

export async function onRequestGet(context) {
  return json({
    user: context.data.user || null
  });
}

export async function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  return new Response("Method Not Allowed", { status: 405 });
}