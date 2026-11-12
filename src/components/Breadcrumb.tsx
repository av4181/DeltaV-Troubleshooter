interface Props {
  trail: string[];
}

export default function Breadcrumb({
  trail,
}: Props) {
  return (
    <div
      style={{
        marginBottom: "1rem",
        color: "#666",
        fontSize: "0.9rem",
      }}
    >
      {trail.join(" > ")}
    </div>
  );
}