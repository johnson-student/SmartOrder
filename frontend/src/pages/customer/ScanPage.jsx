import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const TOKEN_IN_LINK = /\/menu\/([a-f0-9]{64})/i;

// Scans a table QR code with the phone camera, inside the browser (FR-13).
export default function ScanPage() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const [error, setError] = useState('');
  const [wrongCode, setWrongCode] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let scanner;

    (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode'); // loaded only on this page
        if (cancelled) return;
        scanner = new Html5Qrcode('qr-reader');
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text) => {
            const match = text.match(TOKEN_IN_LINK);
            if (match) {
              navigate(`/menu/${match[1]}`, { replace: true });
            } else {
              setWrongCode(true);
            }
          },
          () => {},
        );
      } catch {
        if (!cancelled) {
          setError(
            'We cannot use the camera. Allow camera access in your browser, or scan the code with your phone’s camera app instead.',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      const s = scannerRef.current;
      if (s) {
        Promise.resolve(s.isScanning ? s.stop() : null)
          .catch(() => {})
          .finally(() => {
            try {
              s.clear();
            } catch {
              /* already cleared */
            }
          });
      }
    };
  }, [navigate]);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-6">
      <Link to="/" className="font-semibold text-lagoon-dark">
        ← Back
      </Link>
      <h1 className="mt-3 text-2xl font-bold">Scan your table’s QR code</h1>
      <p className="mt-1 text-ink-soft">Point the camera at the code on your table.</p>
      <div id="qr-reader" className="mt-5 overflow-hidden rounded-lg border border-line bg-white" />
      {wrongCode && (
        <p
          role="alert"
          className="mt-4 rounded-md bg-saffron-tint px-4 py-3 font-medium text-saffron"
        >
          That does not look like a SmartQR table code. Try the code on your table.
        </p>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-md bg-brick-tint px-4 py-3 font-medium text-brick">
          {error}
        </p>
      )}
    </main>
  );
}
