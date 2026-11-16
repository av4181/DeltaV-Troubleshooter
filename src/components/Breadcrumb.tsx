import type { Crumb } from "../engine/engine.ts";

interface Props {
  crumbs: readonly Crumb[];
  onNavigate: (index: number) => void;
}

const VISIBLE = 3;

/** Clickable trail of the last few steps; the last crumb is the current node. */
export default function Breadcrumb({ crumbs, onNavigate }: Props) {
  const start = Math.max(0, crumbs.length - VISIBLE);
  return (
    <nav aria-label="Troubleshooting trail" className="crumbs">
      {start > 0 && (
        <>
          <button onClick={() => onNavigate(start - 1)} title="Earlier steps">…</button>
          <span className="sep">›</span>
        </>
      )}
      {crumbs.slice(start).map((crumb, offset) => {
        const index = start + offset;
        const isLast = index === crumbs.length - 1;
        return (
          <span key={`${crumb.id}-${index}`}>
            {offset > 0 && <span className="sep">›</span>}
            {isLast ? (
              <span aria-current="page">{crumb.title}</span>
            ) : (
              <button onClick={() => onNavigate(index)}>{crumb.title}</button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
