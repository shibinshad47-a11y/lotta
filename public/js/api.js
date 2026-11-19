// LOTTA API & Realtime SSE Client

const TOKEN_KEY = 'lotta_session_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export async function apiRequest(path, { method = 'GET', body = null, isFormData = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let payload = body;
  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(path, { method, headers, body: payload });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function uploadFiles(fileList) {
  const form = new FormData();
  for (const file of fileList) {
    form.append('file', file, file.name || 'upload.bin');
  }
  const res = await apiRequest('/api/uploads', { method: 'POST', body: form, isFormData: true });
  return res.files || [];
}

export class RealtimeClient {
  constructor(handlers = {}) {
    this.handlers = handlers;
    this.es = null;
    this.reconnectTimer = null;
    this.closed = false;
  }

  connect() {
    this.disconnect();
    const token = getToken();
    if (!token) return;

    this.closed = false;
    const url = `/api/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    this.es = es;

    const events = [
      'connected',
      'presence',
      'message_created',
      'messages_delivered',
      'messages_read',
      'typing',
      'message_deleted',
      'message_reactions',
      'conversation_created',
      'conversation_updated',
      'user_updated',
      'block_updated'
    ];

    events.forEach((evtName) => {
      es.addEventListener(evtName, (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          this.handlers[evtName]?.(payload);
        } catch (err) {
          console.error('SSE parse error:', evtName, err);
        }
      });
    });

    es.onopen = () => {
      this.handlers.onStatus?.(true);
    };

    es.onerror = () => {
      this.handlers.onStatus?.(false);
      if (this.closed) return;
      es.close();
      this.es = null;
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = setTimeout(() => {
        if (!this.closed && getToken()) this.connect();
      }, 2500);
    };
  }

  disconnect() {
    this.closed = true;
    clearTimeout(this.reconnectTimer);
    if (this.es) {
      this.es.close();
      this.es = null;
    }
  }
}
