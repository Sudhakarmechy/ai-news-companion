import { StreamPacket } from '@anc/shared';

export class StreamService {
  private sequence = 0;

  nextNarration(text: string, newsId?: string): StreamPacket {
    this.sequence += 1;
    return { type: 'narration', text, newsId, sequence: this.sequence };
  }

  nextAd(text: string): StreamPacket {
    this.sequence += 1;
    return { type: 'ad', text, sequence: this.sequence };
  }
}
