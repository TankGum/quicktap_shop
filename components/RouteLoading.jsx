// UI hiện ra khi Next.js đang chuyển sang 1 route mới (xem app/loading.js, app/san-pham/loading.js).

export default function RouteLoading() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span className="route-spinner" aria-hidden="true" />
      <span className="sr-only">Đang tải…</span>
    </div>
  );
}
