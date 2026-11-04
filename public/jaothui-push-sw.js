/* Push-only worker: no fetch handler and no offline/page caching. */
const eventIdValid = value => typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/.test(value) && !value.includes("..") && !/^(drafts|versions|_)\./.test(value);
function reminderPayload(value, now = Date.now()) {
  if (!value || typeof value.title !== "string" || !value.title.trim() || value.title.length > 200 ||
      typeof value.body !== "string" || value.body.length > 500 || value.data?.kind !== "competition-reminder" ||
      !eventIdValid(value.data.eventId) || typeof value.data.expiresAt !== "string" ||
      !Number.isFinite(Date.parse(value.data.expiresAt)) || Date.parse(value.data.expiresAt) <= now ||
      typeof value.data.reminderId !== "string" || !/^[A-Za-z0-9_.:-]{1,200}$/.test(value.data.reminderId)) return null;
  return { title: value.title, body: value.body, data: { eventId: value.data.eventId, reminderId: value.data.reminderId } };
}
function reminderHistoryPath(eventId) {
  return eventIdValid(eventId) ? `/v2/event-entry?${new URLSearchParams({ eventId, intent: "history" })}` : null;
}
if (typeof module !== "undefined") module.exports = { reminderPayload, reminderHistoryPath };
if (typeof self !== "undefined" && typeof self.addEventListener === "function") {
  self.addEventListener("push", event => {
    let payload;
    try { payload = reminderPayload(event.data?.json()); } catch { return; }
    if (!payload) return;
    event.waitUntil(self.registration.showNotification(payload.title, {
      body: payload.body, icon: "/images/logo.png", tag: `competition:${payload.data.reminderId}`,
      renotify: false, data: payload.data,
    }));
  });
  self.addEventListener("notificationclick", event => {
    event.notification.close();
    const path = reminderHistoryPath(event.notification.data?.eventId);
    if (!path) return;
    const destination = new URL(path, self.location.origin).href;
    event.waitUntil((async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const current = windows.find(client => new URL(client.url).origin === self.location.origin && "navigate" in client);
      if (current) {
        const navigated = await current.navigate(destination);
        if (navigated) return navigated.focus();
      }
      return self.clients.openWindow(destination);
    })());
  });
}
