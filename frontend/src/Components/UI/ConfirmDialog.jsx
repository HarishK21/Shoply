import "./UI.css";

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  onConfirm,
  onCancel,
  busy = false
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="ui-dialogOverlay"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onCancel?.();
        }
      }}
    >
      <div className="ui-dialog" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
        <h2 id="confirm-dialog-title" className="ui-dialog__title">
          {title}
        </h2>
        <p className="ui-dialog__message">{message}</p>

        <div className="ui-dialog__actions">
          <button type="button" className="ui-btn ui-btn--secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`ui-btn ${danger ? "ui-btn--danger" : "ui-btn--primary"}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
