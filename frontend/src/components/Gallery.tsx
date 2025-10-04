import React, { useState, useEffect } from 'react';
import { X, Trash2, Download, Image as ImageIcon } from 'lucide-react';

interface GalleryItem {
  id: string;
  sketch_data: string;
  image_data: string;
  prompt: string;
  created_at: string;
}

interface GalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

const Gallery: React.FC<GalleryProps> = ({ isOpen, onClose }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadGallery();
    }
  }, [isOpen]);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/gallery');
      const data = await response.json();
      setItems(data.items);
    } catch (error) {
      console.error('Failed to load gallery:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this creation?')) return;
    
    try {
      await fetch(`http://localhost:8000/api/gallery/${id}`, {
        method: 'DELETE',
      });
      setItems(items.filter(item => item.id !== id));
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const downloadImage = (imageData: string, prompt: string) => {
    const link = document.createElement('a');
    link.download = `skycanvas-${prompt.substring(0, 20)}-${Date.now()}.png`;
    link.href = imageData;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold">Your Gallery</h2>
            <span className="text-sm text-slate-400">({items.length} creations)</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-slate-400">Loading gallery...</div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <ImageIcon className="w-16 h-16 text-slate-600 mb-4" />
              <p className="text-slate-400 text-lg mb-2">No creations yet!</p>
              <p className="text-slate-500 text-sm">Generate your first AI image to start your gallery</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700 hover:border-purple-500 transition-colors cursor-pointer group"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="aspect-square relative">
                    <img
                      src={item.image_data}
                      alt={item.prompt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="text-white text-sm font-medium">View Details</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-slate-300 line-clamp-2">{item.prompt}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center p-4 z-10">
          <div className="bg-slate-900 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Creation Details</h3>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sketch */}
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">Your Sketch</h4>
                  <img
                    src={selectedItem.sketch_data}
                    alt="Sketch"
                    className="w-full rounded-lg border border-slate-700"
                  />
                </div>

                {/* Generated Image */}
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">AI Generated</h4>
                  <img
                    src={selectedItem.image_data}
                    alt="Generated"
                    className="w-full rounded-lg border border-slate-700"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-slate-800/50 rounded-lg">
                <h4 className="text-sm font-medium text-slate-400 mb-2">Prompt</h4>
                <p className="text-slate-300">{selectedItem.prompt}</p>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => downloadImage(selectedItem.image_data, selectedItem.prompt)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Image
                </button>
                <button
                  onClick={() => deleteItem(selectedItem.id)}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;