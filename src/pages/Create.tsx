import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Upload, X, Film, Image as ImageIcon } from 'lucide-react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';

export default function Create() {
  const [type, setType] = useState<'image' | 'video'>('image');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { token } = useAuth();
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));

      // Auto-detect type
      if (selectedFile.type.startsWith('video/')) {
        setType('video');
      } else {
        setType('image');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpeg', '.jpg', '.gif'],
      'video/*': ['.mp4', '.mov', '.webm']
    },
    maxFiles: 1
  } as unknown as DropzoneOptions);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      formData.append('caption', caption);

      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        navigate('/');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-white">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black/50 backdrop-blur-md">
          <h2 className="font-semibold">Create new post</h2>
          <button onClick={() => navigate(-1)} className="hover:opacity-70 transition-opacity"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8">
          <form onSubmit={handleUpload} className="space-y-8">
            <div className="flex justify-center space-x-4 mb-8">
              <button
                type="button"
                onClick={() => setType('image')}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl border transition-all ${type === 'image' ? 'bg-white text-black border-white font-bold' : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}
              >
                <ImageIcon className="w-5 h-5" />
                <span>Photo</span>
              </button>
              <button
                type="button"
                onClick={() => setType('video')}
                className={`flex items-center space-x-2 px-6 py-2.5 rounded-xl border transition-all ${type === 'video' ? 'bg-white text-black border-white font-bold' : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-600'}`}
              >
                <Film className="w-5 h-5" />
                <span>Reel</span>
              </button>
            </div>

            {!file ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-sky-500 bg-sky-500/10' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'}`}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                  <Upload className="w-8 h-8 text-zinc-400" />
                </div>
                <p className="text-lg font-semibold mb-2">Drag photos or videos here</p>
                <p className="text-zinc-500 text-sm mb-6">Or click to select from your computer</p>
                <button type="button" className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                  Select from computer
                </button>
              </div>
            ) : (
              <div className="relative aspect-square rounded-xl overflow-hidden bg-black border border-zinc-800 shadow-inner group">
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white p-1 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-10"
                >
                  <X className="w-5 h-5" />
                </button>
                {type === 'image' ? (
                  <img src={previewUrl!} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <video src={previewUrl!} className="w-full h-full object-cover" controls />
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Caption</label>
              <textarea
                placeholder="Write a caption..."
                className="w-full p-3.5 bg-black border border-zinc-800 rounded-xl focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none h-32 resize-none transition-all placeholder:text-zinc-600"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isUploading || !file}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-sky-500/20 active:scale-[0.98]"
            >
              {isUploading ? 'Sharing...' : 'Share'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
