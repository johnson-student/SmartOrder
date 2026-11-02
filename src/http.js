export function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}

export function sendJson(response, status, data, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  response.end(JSON.stringify(data));
}

export function checkOrigin(request) {
  if (['GET', 'HEAD'].includes(request.method)) return;
  if (request.headers['sec-fetch-site'] === 'cross-site') {
    fail(403, 'Cross-site requests are blocked.');
  }
  const origin = request.headers.origin;
  const host = request.headers.host;
  if (origin && origin !== `http://${host}` && origin !== `https://${host}`) {
    fail(403, 'Origin is not allowed.');
  }
}

export async function readJson(request) {
  if (!(request.headers['content-type'] || '').startsWith('application/json')) {
    fail(415, 'Use application/json.');
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16384) fail(413, 'Request is too large.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    fail(400, 'Invalid JSON.');
  }
}

export function sendError(response, error) {
  if (error.message?.includes('UNIQUE constraint failed: users.email')) {
    return sendJson(response, 409, { error: 'That email is already in use.' });
  }
  if (!error.status) console.error(error);
  sendJson(response, error.status || 500, {
    error: error.status ? error.message : 'Unexpected server error.',
  });
}
