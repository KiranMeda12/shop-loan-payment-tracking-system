import React, { useState } from 'react';
import { X, Download, FileText, UploadCloud, AlertCircle, CheckCircle2, ImageIcon } from 'lucide-react';
import api from '../api';

// Compress image using Canvas API — reduces phone photos from MBs to ~150-300 KB
function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.75) {
  return new Promise((resolve) => {
    // PDFs and non-images: skip compression
    if (file.type === 'application/pdf') {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Scale down if larger than max dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function SlipModal({ record, isOpen, onClose, onUpdated }) {
  if (!isOpen || !record) return null;

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState('');
  const isPdf = record.slip_filename?.toLowerCase().endsWith('.pdf');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      setError('');
      setCompressionInfo('');

      let fileToUpload = file;

      // Compress images (not PDFs)
      if (file.type !== 'application/pdf') {
        setCompressing(true);
        const originalSizeKB = Math.round(file.size / 1024);
        fileToUpload = await compressImage(file);
        const compressedSizeKB = Math.round(fileToUpload.size / 1024);
        setCompressionInfo(`Compressed: ${originalSizeKB} KB → ${compressedSizeKB} KB`);
        setCompressing(false);
      }

      const formData = new FormData();
      formData.append('slip', fileToUpload);
      await api.post(`/records/${record.id}/upload-slip`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (onUpdated) onUpdated();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload slip.');
      setCompressing(false);
    } finally {
      setUploading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="text-base font-bold">Payment Slip / Proof</h3>
            </div>
            <p className="text-xs text-slate-300">
              Record: {record.record_id} • Customer: {record.customer_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {record.slip_url && (
              <a
                href={record.slip_url}
                download={record.slip_original_name || 'payment_slip'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download Slip
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Note: An uploaded slip does not guarantee payment until you verify and mark it as paid.</span>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        {/* Content Viewer */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-[300px]">
          {record.slip_url ? (
            isPdf ? (
              <div className="w-full h-[450px] flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
                <iframe
                  src={record.slip_url}
                  title="Payment Slip PDF"
                  className="w-full h-full rounded-xl"
                />
              </div>
            ) : (
              <div className="relative max-w-full max-h-[480px] overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xs">
                <img
                  src={record.slip_url}
                  alt="Customer Payment Slip"
                  className="max-h-[440px] w-auto object-contain mx-auto rounded-xl"
                />
              </div>
            )
          ) : (
            <div className="text-center py-10">
              <FileText className="w-16 h-16 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-700">No Slip Uploaded Yet</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                No payment slip or voucher was attached to this record. You can upload one below.
              </p>
            </div>
          )}

          {/* Replace / Upload New Slip */}
          <div className="mt-6 w-full max-w-md pt-4 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500">
                  {record.slip_url ? 'Replace Slip:' : 'Attach Slip:'}
                </span>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
                  📱 Photos auto-compressed to save space
                </p>
              </div>
              <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${compressing || uploading ? 'border-blue-300 bg-blue-50 text-blue-600 cursor-wait' : 'border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 cursor-pointer'} text-xs font-semibold shadow-2xs transition-all`}>
                <UploadCloud className={`w-4 h-4 ${compressing || uploading ? 'animate-bounce' : ''}`} />
                <span>
                  {compressing ? 'Compressing...' : uploading ? 'Uploading...' : 'Choose File'}
                </span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,.webp,.heic,.heif"
                  onChange={handleFileUpload}
                  disabled={uploading || compressing}
                  className="sr-only"
                />
              </label>
            </div>

            {/* Compression Result Info */}
            {compressionInfo && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{compressionInfo} — saved to server</span>
              </div>
            )}

            {/* Compressing progress */}
            {compressing && (
              <div className="flex items-center gap-1.5 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1.5">
                <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Compressing image for fast upload...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
