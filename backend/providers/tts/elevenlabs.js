// backend/providers/tts/elevenlabs.js
require('dotenv').config();
const axios = require('axios');
const TTSProvider = require('./base');

const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY;
const API_BASE = 'https://api.elevenlabs.io/v1';

class ElevenLabsProvider extends TTSProvider {
  async synthesizeSpeech(text, options = {}) {
    const { voiceId = 'pNInz6obpgDQGcFmaJgB', language = 'en' } = options; // Adam default

    if (!ELEVEN_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text required for TTS');
    }

    console.log(`[elevenlabs] Generating ${text.length} chars → voice: ${voiceId.slice(0,8)}`);

    try {
      const response = await axios.post(
        `${API_BASE}/text-to-speech/${voiceId}`,
        {
          text: text.trim().slice(0, 5000), // ElevenLabs limit
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.5,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': ELEVEN_API_KEY
          },
          responseType: 'arraybuffer',
          timeout: 30000
        }
      );

      console.log('[elevenlabs] ✅ Audio generated successfully');
      return {
        buffer: Buffer.from(response.data),
        format: 'mp3',
      };

    } catch (error) {
      console.error('[elevenlabs] ❌ Failed:', error.response?.status, error.message);
      if (error.response?.status === 402) {
        throw new Error('ElevenLabs: Insufficient credits');
      }
      throw new Error(`TTS generation failed: ${error.message}`);
    }
  }
}

module.exports = ElevenLabsProvider;
