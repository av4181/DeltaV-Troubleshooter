import type { Crumb } from "../engine/engine.ts";

interface Props {
  crumbs: readonly Crumb[];
  onNavigate: (index: number) => void;
}

/** Clickable trail; the last crumb is the current node and is not a link. */
export default function Breadcrumb({ crumbs, onNavigate }: Props) {
  return (
    <nav aria-label="Troubleshooting trail" style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={`${crumb.id}-${index}`}>
            {index > 0 && <span style={{ color: "#999" }}> &gt; </span>}
            {isLast ? (
              <span aria-current="page">{crumb.title}</span>
            ) : (
              <button
                onClick={() => onNavigate(index)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#2563eb",
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                {crumb.title}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
