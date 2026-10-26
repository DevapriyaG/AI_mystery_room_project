export default function CctvEvidence({ item }) {
  return (
    <div className="cctv">
      <div className="cctv-overlay">
        <span className="cctv-camera">{item.camera}</span>
        <span className="cctv-rec"><span className="rec-dot" aria-hidden="true" /> REC</span>
        <span className="cctv-time">{item.timestamp}</span>
      </div>
      <p className="cctv-scene">{item.scene}</p>
    </div>
  );
}
