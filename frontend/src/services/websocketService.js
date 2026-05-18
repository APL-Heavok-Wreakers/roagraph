export class WebSocketService {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectTimeout = null;
    this.isConnected = false;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log(`[WebSocket] Already connected or connecting to ${this.url}`);
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log(`[WebSocket] Connected to ${this.url}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connectionChange', true);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type && this.listeners.has(data.type)) {
            this.emit(data.type, data.payload);
          }
        } catch (err) {
          console.error('[WebSocket] Message parsing error:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        this.isConnected = false;
        this.emit('connectionChange', false);
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.handleReconnect();
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[WebSocket] Reconnecting... Attempt ${this.reconnectAttempts}`);
      this.reconnectTimeout = setTimeout(() => {
        this.connect();
      }, 3000 * this.reconnectAttempts); // Exponential backoff simulation
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
    }
  }

  subscribe(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);

    return () => {
      const typeListeners = this.listeners.get(type);
      if (typeListeners) {
        typeListeners.delete(callback);
        if (typeListeners.size === 0) {
          this.listeners.delete(type);
        }
      }
    };
  }

  emit(type, data) {
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach(callback => callback(data));
    }
  }
}

// Create a singleton instance pointing to the expected backend URL
// In production, this would be an env variable like import.meta.env.VITE_WS_URL
export const wsService = new WebSocketService('ws://localhost:8000/ws');
