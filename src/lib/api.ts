export const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export const YOLO_URL: string = import.meta.env.VITE_YOLO_URL ?? "http://localhost:8001";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(`${API_URL}${path}`),
  post: <T>(path: string, body?: unknown) =>
    request<T>(`${API_URL}${path}`, { method: "POST", body: JSON.stringify(body) }),
};

export const ml = {
  detect: <T>(body: unknown) =>
    request<T>(`${YOLO_URL}/detect`, { method: "POST", body: JSON.stringify(body) }),
};
