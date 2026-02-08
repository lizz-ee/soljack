import { WebSocketServer, WebSocket } from 'ws';
import { config } from './config';

interface Client {
  ws: WebSocket;
  subscriptions: Set<string>;
}

const clients = new Map<WebSocket, Client>();

export function initWebSocket() {
  const wss = new WebSocketServer({ port: config.wsPort });

  wss.on('connection', (ws: WebSocket) => {
    const client: Client = {
      ws,
      subscriptions: new Set(),
    };
    clients.set(ws, client);

    console.log('Client connected. Total:', clients.size);

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(client, message);
      } catch (error) {
        console.error('Invalid message:', error);
        ws.send(JSON.stringify({ event: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected. Total:', clients.size);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return wss;
}

function handleMessage(client: Client, message: any) {
  const { event, tableId } = message;

  switch (event) {
    case 'subscribe':
      if (tableId) {
        client.subscriptions.add(tableId);
        client.ws.send(JSON.stringify({ event: 'subscribed', tableId }));
      }
      break;

    case 'unsubscribe':
      if (tableId) {
        client.subscriptions.delete(tableId);
        client.ws.send(JSON.stringify({ event: 'unsubscribed', tableId }));
      }
      break;

    default:
      client.ws.send(JSON.stringify({ event: 'error', message: 'Unknown event type' }));
  }
}

export function broadcastToTable(tableId: string, data: any) {
  clients.forEach((client) => {
    if (client.subscriptions.has(tableId) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  });
}

export function broadcastToAll(data: any) {
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  });
}