import { after } from "next/server";
import { createAdminSupabase } from "./supabase/server";
import { getSiteUrl } from "./supabase/config";

type WishlistEmail = {
  eventId: string;
  recipientId: string;
};

/**
 * Emails the assigned giver that their recipient changed a wishlist.
 * Runs only on the server, uses the service-role key to resolve the giver's
 * address, and never returns that identity to the recipient.
 *
 * Failures are swallowed on purpose: email is best-effort and must never make
 * a wishlist save fail or corrupt a draw.
 */
export function queueWishlistEmail({ eventId, recipientId }: WishlistEmail) {
  after(async () => {
    if (!process.env.BREVO_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return;
    }

    try {
      const admin = createAdminSupabase();
      if (!admin) return;

      const [{ data: recipientMember }, { data: event }] = await Promise.all([
        admin
          .from("event_members")
          .select("id, display_name")
          .eq("event_id", eventId)
          .eq("user_id", recipientId)
          .maybeSingle(),
        admin.from("events").select("name").eq("id", eventId).maybeSingle(),
      ]);

      if (!recipientMember?.id || !event?.name) return;

      const { data: assignment } = await admin
        .from("assignments")
        .select("giver_member_id")
        .eq("event_id", eventId)
        .eq("recipient_member_id", recipientMember.id)
        .maybeSingle();

      if (!assignment?.giver_member_id) return;

      const { data: giverMember } = await admin
        .from("event_members")
        .select("user_id, display_name")
        .eq("id", assignment.giver_member_id)
        .maybeSingle();

      // Anonymous givers have no account to email; their personal link still
      // shows the updated wishlist when they open it.
      if (!giverMember?.user_id) return;

      const [{ data: giverProfile }, giverUser] = await Promise.all([
        admin
          .from("profiles")
          .select("full_name")
          .eq("id", giverMember.user_id)
          .maybeSingle(),
        admin.auth.admin.getUserById(giverMember.user_id),
      ]);

      const giverEmail = giverUser.data.user?.email;
      if (!giverEmail) return;

      const recipientName = recipientMember.display_name ?? "Your recipient";
      const giverName = giverProfile?.full_name ?? "there";
      const link = `${getSiteUrl()}/events/${eventId}/recipient`;

      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": process.env.BREVO_API_KEY as string,
        },
        body: JSON.stringify({
          sender: {
            name: process.env.BREVO_SENDER_NAME ?? "ChingChingGift",
            email: process.env.BREVO_SENDER_EMAIL ?? "hello@chingchinggift.app",
          },
          to: [{ email: giverEmail, name: giverName }],
          subject: `Your Secret Santa recipient updated their wishlist 🎁`,
          htmlContent: wishlistEmailHtml({ giverName, recipientName, eventName: event.name, link }),
          textContent: `Hi ${giverName},\n\n${recipientName} added or updated items on their Christmas wishlist for ${event.name}.\n\nSee their latest gift preferences: ${link}\n\nHappy gifting!\nChingChingGift`,
        }),
        signal: AbortSignal.timeout(8000),
      });
    } catch (error) {
      console.error("[chingchinggift] wishlist email failed", error);
    }
  });
}

function wishlistEmailHtml({
  giverName,
  recipientName,
  eventName,
  link,
}: {
  giverName: string;
  recipientName: string;
  eventName: string;
  link: string;
}) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f7f3e8;font-family:Georgia,'Times New Roman',serif;color:#1d2a24;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fffdf7;border:1px solid #e3dccb;border-radius:18px;overflow:hidden;">
          <tr><td style="background:#0f3d2e;padding:24px 32px;color:#f7f3e8;font-size:20px;">🎄 ChingChingGift</td></tr>
          <tr><td style="padding:32px;">
            <p style="margin:0 0 12px;font-size:16px;">Hi ${escapeHtml(giverName)},</p>
            <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;color:#0f3d2e;">A wishlist update from your Secret Santa recipient</h1>
            <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#4b5a52;">
              <strong>${escapeHtml(recipientName)}</strong> added or updated items on their Christmas wishlist for
              <strong>${escapeHtml(eventName)}</strong>. Take a peek so you can choose a gift they will love.
            </p>
            <a href="${link}" style="display:inline-block;background:#b3271f;color:#fffdf7;text-decoration:none;padding:13px 22px;border-radius:999px;font-family:Arial,sans-serif;font-size:15px;font-weight:600;">View their wishlist</a>
            <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#7a857f;">This email is private to you. Never share your assignment with the group — the surprise is the best part.</p>
          </td></tr>
          <tr><td style="padding:18px 32px;background:#f2ecdd;font-family:Arial,sans-serif;font-size:12px;color:#7a857f;">Sent by ChingChingGift · Christmas exchanges, made simple.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
