import type { ReactNode } from 'react';

export function AdminPageHead({ title, lead, actions }: { title: string; lead?: string; actions?: ReactNode }): JSX.Element {
  return (
    <div className="admin-page-head">
      <div>
        <h1 className="admin-page-title" tabIndex={-1}>{title}</h1>
        {lead ? <p className="admin-page-lead">{lead}</p> : null}
      </div>
      {actions ? <div className="admin-actions">{actions}</div> : null}
    </div>
  );
}
