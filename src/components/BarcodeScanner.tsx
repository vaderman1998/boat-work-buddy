import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { DecodeHintType } from '@zxing/library';
import { Camera, ImagePlus, ScanBarcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function BarcodeScanner({ onScan, close }: { onScan: (barcode: string) => void; close: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const controls = useRef<IScannerControls>();
  const active = useRef(true);
  const [camera, setCamera] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const accept = (value: string) => {
    if (!active.current || !value.trim()) return;
    active.current = false;
    controls.current?.stop();
    onScan(value.trim());
    close();
  };
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; controls.current?.stop(); };
  }, []);
  useEffect(() => {
    if (!camera || !video.current) return;
    let disposed = false;
    const reader = new BrowserMultiFormatReader(new Map([[DecodeHintType.TRY_HARDER, true]]));
    reader.decodeFromConstraints({ video: { facingMode: { ideal: 'environment' } }, audio: false }, video.current, (result, _error, scanner) => {
      if (result && !disposed && active.current) { scanner.stop(); accept(result.getText()); }
    }).then(scanner => {
      if (disposed || !active.current) scanner.stop();
      else controls.current = scanner;
    }).catch(() => {
      if (!disposed && active.current) { setCamera(false); setError('Camera unavailable. Allow camera access, choose a photo, or enter the barcode.'); }
    });
    return () => { disposed = true; controls.current?.stop(); };
  }, [camera]);
  const readPhoto = async (image: File) => {
    controls.current?.stop();
    setCamera(false);
    setBusy(true);
    setError('');
    const url = URL.createObjectURL(image);
    try {
      const reader = new BrowserMultiFormatReader(new Map([[DecodeHintType.TRY_HARDER, true]]));
      const result = await reader.decodeFromImageUrl(url);
      accept(result.getText());
    } catch {
      if (active.current) setError('No barcode found in this photo. Try a clearer photo or enter the barcode.');
    } finally { URL.revokeObjectURL(url); if (active.current) setBusy(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open) close(); }}><DialogContent className="max-h-[90dvh] overflow-y-auto"><DialogHeader><DialogTitle>Scan barcode</DialogTitle><DialogDescription className="sr-only">Barcode camera, photo, or manual entry</DialogDescription></DialogHeader>
    {camera && <video ref={video} autoPlay muted playsInline aria-label="Barcode camera" className="aspect-[4/3] w-full rounded-md bg-muted object-cover" />}
    <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => { setError(''); if (camera) { controls.current?.stop(); setCamera(false); } else setCamera(true); }}><Camera className="mr-2 h-4 w-4" />{camera ? 'Stop camera' : 'Use camera'}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => file.current?.click()}><ImagePlus className="mr-2 h-4 w-4" />{busy ? 'Reading photo…' : 'Choose photo'}</Button></div>
    <input ref={file} type="file" accept="image/*" aria-label="Barcode photo" className="hidden" onChange={event => { const image = event.target.files?.[0]; if (image) void readPhoto(image); event.target.value = ''; }} />
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <form className="space-y-3" onSubmit={event => { event.preventDefault(); accept(code); }}><Label htmlFor="scan-code">Barcode number</Label><Input id="scan-code" value={code} onChange={event => setCode(event.target.value)} autoComplete="off" /><Button disabled={!code.trim() || busy}><ScanBarcode className="mr-2 h-4 w-4" />Use barcode</Button></form>
  </DialogContent></Dialog>;
}