export default function PhotoEvidence({ item }) {
  return (
    <figure className="polaroid">
      <div className="polaroid-image">
        <span className="polaroid-label">Evidence photo</span>
        <span className="polaroid-icon" aria-hidden="true">📷</span>
      </div>
      <figcaption className="polaroid-caption">{item.scene}</figcaption>
    </figure>
  );
}
