import type { ThreadMessage } from "@/modules/messaging/queries";
import { isoDate } from "@/lib/dates";

/**
 * Shared client/coach message thread. The form `action` and optional
 * `membershipId` differ per surface; everything else is common.
 */
export function MessagesPanel({
  title,
  hint,
  messages,
  viewerId,
  action,
  membershipId,
  otherLabel,
}: {
  title: string;
  hint: string;
  messages: ThreadMessage[];
  viewerId: string;
  action: (formData: FormData) => void | Promise<void>;
  membershipId?: string;
  otherLabel: string;
}) {
  return (
    <section className="section-card">
      <h2 className="section-title">{title}</h2>
      <p className="section-hint">{hint}</p>

      {messages.length === 0 ? (
        <p className="msg-empty">No messages yet. Say hello.</p>
      ) : (
        <div className="msg-list">
          {messages.map((m) => {
            const isMe = m.senderId === viewerId;
            return (
              <div key={m.id} className={`msg ${isMe ? "msg--me" : "msg--them"}`}>
                <div className="msg-meta">
                  {isMe ? "You" : m.sender.role === "CLIENT" ? otherLabel : m.sender.fullName} ·{" "}
                  {isoDate(m.createdAt)}
                </div>
                {m.body}
              </div>
            );
          })}
        </div>
      )}

      <form action={action} className="msg-form">
        {membershipId && <input type="hidden" name="membershipId" value={membershipId} />}
        <input name="body" className="field-input" placeholder="Write a message…" autoComplete="off" required />
        <button type="submit" className="btn-primary">Send</button>
      </form>
    </section>
  );
}
