const DIRECTIONS = {
  incoming: { arrow: '↙', label: 'Incoming' },
  outgoing: { arrow: '↗', label: 'Outgoing' },
  missed: { arrow: '↙', label: 'Missed' },
};

export default function CallLogEvidence({ item }) {
  return (
    <div className="call-log">
      {item.owner && <div className="call-log-owner">Recent calls · {item.owner}</div>}
      <ul>
        {item.calls.map((call, i) => {
          const direction = DIRECTIONS[call.direction] || DIRECTIONS.outgoing;
          return (
            <li key={i} className={`call call-${call.direction}`}>
              <span className="call-arrow" aria-hidden="true">{direction.arrow}</span>
              <div className="call-main">
                <span className="call-contact">{call.contact}</span>
                <span className="call-direction">{direction.label}</span>
              </div>
              <div className="call-meta">
                <span>{call.time}</span>
                <span>{call.direction === 'missed' ? '—' : call.duration}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
