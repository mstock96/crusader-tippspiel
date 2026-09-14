const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Standard utility wrapper around the native browser fetch API.
 * Automatically injects the stored JWT token into the Authorization header for authenticated requests.
 * Inherently handles session expiration cascades mapping HTTP 401 statuses to forced logouts.
 * @param endpoint The route postfix string indicating the request destination (e.g. '/tournaments').
 * @param options Expanded request configuration matching the native RequestInit interface.
 * @returns The resolved fetch API Response object for downstream json-parsing or status verifications.
 */
export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    const url = `${BASE_URL}${cleanEndpoint}`;


    const token = localStorage.getItem('jwt_token');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {...options, headers});

    // Nur bei 401 ist das Token wirklich tot/ungültig!
    if (response.status === 401) {
        console.warn("Sitzung abgelaufen (401). Bitte neu anmelden.");
        localStorage.removeItem('jwt_token');
        window.location.reload();
    } else if (response.status === 403) {
        console.warn("Zugriff verweigert (403): Keine Berechtigung für diese Aktion.");
    }

    return response;
}
