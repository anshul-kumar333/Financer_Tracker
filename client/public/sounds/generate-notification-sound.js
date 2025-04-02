// Generate notification sound using Web Audio API
async function generateNotificationSound() {
  try {
    // Load the waveform data
    const response = await fetch('/sounds/notification-data.json');
    if (!response.ok) throw new Error('Failed to load notification data');
    const data = await response.json();
    
    // Create audio context
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const sampleRate = data.sampleRate;
    const duration = data.duration;
    
    // Create buffer
    const bufferSize = Math.ceil(sampleRate * duration);
    const audioBuffer = audioContext.createBuffer(data.channels, bufferSize, sampleRate);
    
    // Fill buffer with waveform data
    const channelData = audioBuffer.getChannelData(0);
    const waveform = data.waveformData;
    
    // Interpolate waveform points to fill the buffer
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      const index = t * (waveform.length - 1);
      const indexLow = Math.floor(index);
      const indexHigh = Math.ceil(index);
      const fraction = index - indexLow;
      
      // Linear interpolation between points
      channelData[i] = waveform[indexLow] * (1 - fraction) + waveform[indexHigh] * fraction;
      
      // Apply envelope (quick attack, longer decay)
      const envelope = i < bufferSize * 0.1 ? i / (bufferSize * 0.1) : Math.pow(1 - ((i - bufferSize * 0.1) / (bufferSize * 0.9)), 1.5);
      channelData[i] *= envelope;
    }
    
    // Create source node and connect to destination
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Create a gain node for volume control
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 0.5; // 50% volume
    
    // Connect nodes: source -> gain -> destination
    source.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play the sound
    source.start();
    
    // Save the buffer to WAV
    saveAsWav(audioBuffer, 'notification.mp3');
  } catch (error) {
    console.error('Failed to generate notification sound:', error);
  }
}

// Convert AudioBuffer to WAV and save (works in Chrome only)
function saveAsWav(audioBuffer, filename) {
  // Get raw PCM data from the buffer
  const numberOfChannels = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  
  // Create the WAV file container
  const buffer = new ArrayBuffer(44 + length * numberOfChannels * bytesPerSample);
  const view = new DataView(buffer);
  
  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * bytesPerSample, true);
  writeString(view, 8, 'WAVE');
  
  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // audio format (1 = PCM)
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true); // byte rate
  view.setUint16(32, numberOfChannels * bytesPerSample, true); // block align
  view.setUint16(34, bitsPerSample, true);
  
  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, length * numberOfChannels * bytesPerSample, true);
  
  // Write the PCM samples
  const data = audioBuffer.getChannelData(0);
  let offset = 44;
  
  for (let i = 0; i < length; i++) {
    // Convert float to int
    const sample = Math.max(-1, Math.min(1, data[i]));
    const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    
    // Write 16-bit sample
    view.setInt16(offset, value, true);
    offset += bytesPerSample;
  }
  
  // Create Blob and download
  const blob = new Blob([buffer], {type: 'audio/wav'});
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  document.body.appendChild(a);
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  a.click();
  
  // Cleanup
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// Write a string to a DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Run the generator when loaded
window.addEventListener('DOMContentLoaded', () => {
  const button = document.createElement('button');
  button.textContent = 'Generate Notification Sound';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.style.padding = '10px 20px';
  button.style.backgroundColor = '#1A73E8';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '4px';
  button.style.cursor = 'pointer';
  
  button.addEventListener('click', generateNotificationSound);
  
  document.body.appendChild(button);
});