import { Server } from 'ws';
import { StreamService } from '../services/streamService';

export function attachSocketServer(server: import('http').Server) {
  const wss = new Server({ server, path: '/stream' });
  const streamService = new StreamService();

  wss.on('connection', (socket) => {
    socket.send(JSON.stringify(streamService.nextNarration('Welcome back. Starting your personalized global briefing.')));

    const interval = setInterval(() => {
      socket.send(JSON.stringify(streamService.nextNarration('Top story update: AI infrastructure spending rises across multiple regions.')));
    }, 5000);

    socket.on('message', (raw) => {
      const message = raw.toString();
      if (message.includes('interrupt')) {
        socket.send(JSON.stringify(streamService.nextNarration('Sure. Switching to conversational mode and answering your question.')));
      }
      if (message.includes('ad-slot')) {
        socket.send(JSON.stringify(streamService.nextAd('Sponsored: Upgrade to premium for ad-free continuous news.')));
      }
    });

    socket.on('close', () => clearInterval(interval));
  });
}
