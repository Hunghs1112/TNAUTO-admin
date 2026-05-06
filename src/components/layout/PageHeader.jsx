import { memo } from 'react';
import { Plus, RefreshCw } from 'lucide-react';

function PageHeader({
  title,
  badge,
  onRefresh,
  onCreate,
  createButtonText = 'Thêm mới',
  children,
}) {
  return (
    <section className="app-hero">
      <div className="app-hero-content">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[1.75rem] font-bold tracking-tight text-white">{title}</h1>
            {badge ? <span className="app-badge">{badge}</span> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                className="app-icon-button"
                title="Làm mới dữ liệu"
                aria-label="Làm mới dữ liệu"
              >
                <RefreshCw size={18} />
              </button>
            ) : null}
            {onCreate ? (
              <button type="button" onClick={onCreate} className="btn-gradient-primary">
                <Plus size={18} />
                <span>{createButtonText}</span>
              </button>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export default memo(PageHeader);
