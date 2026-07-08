export function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={`btn ${variant ? `btn-${variant}` : ''} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function Alert({ tone = 'info', children }) {
  if (!children) return null;
  return <p className={`alert alert-${tone}`}>{children}</p>;
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function StatusBadge({ status, children }) {
  return <span className={`badge ${status || ''}`}>{children || status}</span>;
}

export function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="section-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {action && <div className="section-actions">{action}</div>}
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty-state">
      <b>{title}</b>
      {children && <p>{children}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

export function DataTable({ columns, rows, emptyText = 'Chưa có dữ liệu' }) {
  if (!rows.length) return <EmptyState title={emptyText} />;
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={row.id || row.transRefId || row.code || idx}>
              {columns.map((c) => (
                <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Metric({ label, value }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}
