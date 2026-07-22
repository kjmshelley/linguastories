export class LessonAudioService {
  constructor({ speech = globalThis.speechSynthesis, Utterance = globalThis.SpeechSynthesisUtterance, AudioClass = globalThis.Audio, preferences = () => ({ audioEnabled: true, audioSpeed: "normal", voiceURI: "" }) } = {}) {
    this.speech = speech; this.Utterance = Utterance; this.AudioClass = AudioClass; this.preferences = preferences; this.currentAudio = null;
  }
  get canSpeak() { return Boolean(this.speech && this.Utterance); }
  stop() {
    this.currentAudio?.pause?.();
    this.currentAudio = null;
    this.speech?.cancel?.();
  }
  compatibleVoices(language = "zh-TW") { const voices = this.speech?.getVoices?.() || []; const exact = voices.filter((voice) => String(voice.lang).toLowerCase() === language.toLowerCase()); return exact.length ? exact : voices.filter((voice) => String(voice.lang).toLowerCase().startsWith("zh")); }
  play({ audioUrl, text, rate, voiceURI } = {}) {
    const preferences = this.preferences?.() || {};
    if (preferences.audioEnabled === false) return Promise.resolve(false);
    const resolvedRate = rate ?? ({ slow: 0.78, normal: 0.92, fast: 1.08 }[preferences.audioSpeed] || 0.92);
    this.stop();
    if (audioUrl && this.AudioClass) {
      this.currentAudio = new this.AudioClass(audioUrl);
      this.currentAudio.playbackRate = resolvedRate;
      return this.currentAudio.play().catch(() => this.speak(text, resolvedRate, voiceURI || preferences.voiceURI));
    }
    return this.speak(text, resolvedRate, voiceURI || preferences.voiceURI);
  }
  speak(text, rate = 0.92, voiceURI = "") {
    if (!this.canSpeak || !text) return Promise.resolve(false);
    const utterance = new this.Utterance(String(text));
    utterance.lang = "zh-TW";
    utterance.rate = rate;
    utterance.voice = this.compatibleVoices().find((voice) => voice.voiceURI === voiceURI) || this.compatibleVoices()[0] || null;
    this.speech.speak(utterance);
    return Promise.resolve(true);
  }
}
