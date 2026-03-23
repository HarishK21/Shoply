import "./UI.css";

const TITLES = {
  info: "Info",
  success: "Success",
  warning: "Attention",
  error: "Something went wrong"
};

export default function Notice({
  type = "info",
  title,
  message,
  dismissLabel = "Dismiss",
  onDismiss,
  actionLabel,
  onAction,
  compact = false,
  ariaLive = "polite"
}) {
  if (!message) {
    return null;
  }

  return (
    <section
      className={`ui-notice ui-notice--${type} ${compact ? "ui-notice--compact" : ""}`.trim()}
      role={type === "error" ? "alert" : "status"}
      aria-live={ariaLive}
    >
      <div className="ui-notice__content">
        <h3 className="ui-notice__title">{title || TITLES[type] || TITLES.info}</h3>
        <p className="ui-notice__message">{message}</p>
      </div>

      <div className="ui-notice__actions">
        {actionLabel && typeof onAction === "function" && (
          <button type="button" className="ui-btn ui-btn--secondary" onClick={onAction}>
            {actionLabel}
          </button>
        )}
        {typeof onDismiss === "function" && (
          <button type="button" className="ui-btn ui-btn--ghost" onClick={onDismiss}>
            {dismissLabel}
          </button>
        )}
      </div>
    </section>
  );
}
