import { useState } from "react";

interface Props {
  text: string;
  /** Characters shown before "Show more". */
  limit?: number;
}

/** Long explanations start short; the rest is one click away. */
export default function Prose({ text, limit = 260 }: Props) {
  const [open, setOpen] = useState(false);
  if (text.length <= limit + 40) return <p>{text}</p>;
  const cut = text.lastIndexOf(" ", limit);
  return (
    <p className="prose">
      {open ? text : `${text.slice(0, cut > 0 ? cut : limit)}…`}
      <button className="toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? "Show less" : "Show more"}
      </button>
    </p>
  );
}
