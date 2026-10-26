// The first participant is the phone's owner: their messages sit on the right
export default function ChatEvidence({ item }) {
  const [owner, ...others] = item.participants;
  const isGroup = others.length > 1;

  return (
    <div className="phone">
      <div className="phone-header">
        <span className="phone-avatar" aria-hidden="true">{(others[0] || '?').charAt(0)}</span>
        <div>
          <div className="phone-contact">{others.join(', ')}</div>
          <div className="phone-subtitle">{owner}'s phone</div>
        </div>
      </div>
      <div className="phone-messages">
        {item.messages.map((message, i) => {
          const mine = message.from === owner;
          return (
            <div key={i} className={`bubble ${mine ? 'bubble-out' : 'bubble-in'}`}>
              {!mine && isGroup && <div className="bubble-sender">{message.from}</div>}
              <div className="bubble-text">{message.text}</div>
              {message.time && <div className="bubble-time">{message.time}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
