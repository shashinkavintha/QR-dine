"use client";

import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCw, Smartphone, Tablet, Monitor, Check } from 'lucide-react';

// Creates an Image object from a src - no crossOrigin needed for data: URLs
function createImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    // Only set crossOrigin for http URLs, NOT for data: or blob: URLs
    // Setting crossOrigin on a data: URL can cause issues in some browsers
    if (url.startsWith('http://') || url.startsWith('https://')) {
      image.setAttribute('crossOrigin', 'anonymous');
    }
    image.src = url;
  });
}

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
  return new Promise((resolve) => { canvas.toBlob((blob) => { resolve(blob); }, 'image/jpeg', 0.95); });
}

function PhonePreview({ imageUrl }) {
  return (
    <div className="relative mx-auto" style={{ width: 160, height: 320 }}>
      <div className="absolute inset-0 rounded-[2.5rem] border-[8px] border-slate-900 bg-black shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-14 h-4 bg-slate-900 rounded-b-xl z-10" />
        <div className="w-full h-full overflow-hidden rounded-[2rem] bg-slate-100">
          {imageUrl ? <img src={imageUrl} alt="Phone preview" className="w-full h-full object-cover" /> : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 text-xs font-medium p-4 text-center">
              <Smartphone size={28} className="text-slate-300" />No image
            </div>
          )}
        </div>
      </div>
      <div className="absolute right-0 top-20 w-1 h-10 bg-slate-900 rounded-l-sm" />
      <div className="absolute left-0 top-16 w-1 h-6 bg-slate-900 rounded-r-sm" />
      <div className="absolute left-0 top-24 w-1 h-6 bg-slate-900 rounded-r-sm" />
    </div>
  );
}

function TabletPreview({ imageUrl }) {
  return (
    <div className="relative mx-auto" style={{ width: 240, height: 320 }}>
      <div className="absolute inset-0 rounded-[2rem] border-[10px] border-slate-900 bg-black shadow-2xl overflow-hidden">
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-600 z-10" />
        <div className="w-full h-full overflow-hidden rounded-[1.5rem] bg-slate-100">
          {imageUrl ? <img src={imageUrl} alt="Tablet preview" className="w-full h-full object-cover" /> : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 text-xs font-medium p-4 text-center">
              <Tablet size={28} className="text-slate-300" />No image
            </div>
          )}
        </div>
      </div>
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-slate-900 rounded-r-sm" />
    </div>
  );
}

function LaptopPreview({ imageUrl }) {
  return (
    <div className="relative mx-auto" style={{ width: 300, height: 210 }}>
      <div className="absolute top-0 left-0 right-0" style={{ height: 178 }}>
        <div className="w-full h-full rounded-t-xl border-[8px] border-slate-900 border-b-0 bg-black overflow-hidden">
          <div className="w-full h-full bg-slate-100 overflow-hidden">
            {imageUrl ? <img src={imageUrl} alt="Laptop preview" className="w-full h-full object-cover" /> : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 text-xs font-medium p-4 text-center">
                <Monitor size={28} className="text-slate-300" />No image
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-slate-600" />
      </div>
      <div className="absolute left-0 right-0 h-8 bg-slate-900 rounded-b-xl" style={{ top: 178 }}>
        <div className="w-20 h-3 bg-slate-800 rounded-b-lg mx-auto" />
      </div>
    </div>
  );
}

const ASPECT_RATIOS = { phone: 9 / 16, tablet: 3 / 4, laptop: 16 / 9 };
const DEVICE_META = {
  phone:  { label: 'Phone',  Icon: Smartphone },
  tablet: { label: 'Tablet', Icon: Tablet },
  laptop: { label: 'Laptop', Icon: Monitor },
};

export default function ImageAdjusterModal({ deviceType, imageSrc, onClose, onSave }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const onCropComplete = useCallback((_, cap) => { setCroppedAreaPixels(cap); }, []);

  useEffect(() => {
    if (!croppedAreaPixels || !imageSrc) return;
    setPreviewError(false);
    const timer = setTimeout(async () => {
      try {
        const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
        const url = URL.createObjectURL(blob);
        setPreview(prev => {
          if (prev && prev.startsWith('blob:')) URL.revokeObjectURL(prev);
          return url;
        });
      } catch (e) {
        console.error('Preview generation error:', e);
        setPreviewError(true);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [croppedAreaPixels, imageSrc]);

  const handleSave = async () => {
    if (!croppedAreaPixels || !imageSrc) return;
    setSaving(true);
    try {
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([blob], `mockup_${deviceType}.jpg`, { type: 'image/jpeg' });
      await onSave(file);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Error processing image. Please try uploading a new image instead.');
    }
    finally { setSaving(false); }
  };

  const { label, Icon } = DEVICE_META[deviceType];
  const PreviewComponent = deviceType === 'phone' ? PhonePreview : deviceType === 'tablet' ? TabletPreview : LaptopPreview;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center"><Icon size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Adjust {label} Image</h2>
              <p className="text-xs text-slate-500 font-medium">Drag to reposition · Scroll or slider to zoom · Live preview on right</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <X size={18} className="text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          {/* Crop Area */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="relative flex-1 bg-slate-900 min-h-[300px]">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={ASPECT_RATIOS[deviceType]}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                style={{
                  containerStyle: { borderRadius: 0 },
                  cropAreaStyle: { border: '2px solid rgba(255,255,255,0.9)', borderRadius: 8 },
                }}
              />
            </div>
            {/* Controls */}
            <div className="px-6 py-4 border-t border-slate-200 bg-white shrink-0 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Zoom</label>
                <div className="flex items-center gap-3">
                  <ZoomOut size={16} className="text-slate-400 shrink-0" />
                  <input type="range" min={1} max={3} step={0.05} value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full h-2 rounded-full accent-purple-600 cursor-pointer" />
                  <ZoomIn size={16} className="text-slate-400 shrink-0" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Rotation</label>
                <div className="flex items-center gap-3">
                  <RotateCw size={16} className="text-slate-400 shrink-0" />
                  <input type="range" min={-180} max={180} step={1} value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-full h-2 rounded-full accent-purple-600 cursor-pointer" />
                  <span className="text-xs text-slate-500 font-mono w-10 text-right shrink-0">{rotation}°</span>
                </div>
              </div>
              <button onClick={() => { setZoom(1); setRotation(0); setCrop({ x: 0, y: 0 }); }}
                className="text-xs text-slate-500 font-semibold px-4 py-1.5 bg-slate-100 rounded-lg hover:bg-slate-200">
                Reset
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center p-8 gap-6 shrink-0">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Preview</p>
            {previewError ? (
              <div className="text-center text-xs text-amber-600 bg-amber-50 rounded-xl p-4 border border-amber-200">
                Preview unavailable for this image source. The crop will still be applied on save.
              </div>
            ) : (
              <PreviewComponent imageUrl={preview} />
            )}
            <button onClick={handleSave} disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 disabled:opacity-50 transition-all">
              {saving ? <span>Saving...</span> : <><Check size={16} />Save &amp; Apply</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
