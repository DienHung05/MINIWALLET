export default function AuthLayout({ eyebrow, title, subtitle, children, footer }) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-header">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </section>
    </main>
  );
}
