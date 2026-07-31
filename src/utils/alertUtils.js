// Web Audio and Desktop Notification Utilities for Live Signals

export function playAlertSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // First tone (A5 - 880Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.25, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.25);

    // Second higher chime (D6 - 1174.66Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.18);
    gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.18);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (err) {
    console.error("Audio playback error:", err);
  }
}

export function triggerDesktopNotification(signal) {
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    const pairName = (signal.pair || "").replace("frx", "").replace("/", "");
    const title = `🚀 NEW ${signal.signal} SIGNAL: ${pairName}`;
    const body = `Strategy: ${signal.strategy_name || "Institutional Setup"}\nEntry: ${signal.entry_price}\nExpiry: 5 Minutes`;

    try {
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        requireInteraction: true,
        tag: `signal-${signal.id || Date.now()}`
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.error("Failed to display notification:", e);
    }
  }
}

export async function requestAlertPermission() {
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notifications.");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    playAlertSound(); // Play test chime
    return true;
  }
  return false;
}
