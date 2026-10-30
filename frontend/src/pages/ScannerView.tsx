import { useState } from 'react';
import { Barcode, Package, CheckCircle, Plus, Minus, Send, Trash2 } from 'lucide-react';

interface ScannedItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
}

export default function ScannerView() {
  const [skuInput, setSkuInput] = useState('');
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  // Simulate a barcode scan or manual entry
  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuInput.trim()) return;

    const formattedSku = skuInput.trim().toUpperCase();
    
    // Check if item already exists in the current scan batch
    const existingItemIndex = scannedItems.findIndex(item => item.sku === formattedSku);
    
    if (existingItemIndex >= 0) {
      // Increment quantity if already scanned
      const updatedItems = [...scannedItems];
      updatedItems[existingItemIndex].quantity += 1;
      setScannedItems(updatedItems);
    } else {
      // Add new item to batch (Mocking the product name)
      setScannedItems([
        { id: Date.now().toString(), sku: formattedSku, name: 'Incoming Fulfillment Item', quantity: 1 },
        ...scannedItems
      ]);
    }
    setSkuInput(''); // Clear input for next scan
  };

  const updateQuantity = (id: string, delta: number) => {
    setScannedItems(items => items.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setScannedItems(items => items.filter(item => item.id !== id));
  };

  const handleSync = () => {
    setIsSyncing(true);
    // Simulate API delay
    setTimeout(() => {
      setScannedItems([]);
      setIsSyncing(false);
      alert('Batch successfully synced to the database!');
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Inbound Receiving</h2>
        <p className="text-sm text-gray-500 mb-6">Scan barcodes or enter SKUs manually to register incoming dock shipments.</p>
        
        {/* Scanner Input Area */}
        <form onSubmit={handleScan} className="flex space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Barcode className="h-6 w-6 text-gray-400" />
            </div>
            <input
              type="text"
              autoFocus
              value={skuInput}
              onChange={(e) => setSkuInput(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 border-2 border-indigo-100 rounded-xl bg-indigo-50/30 text-lg focus:ring-0 focus:border-indigo-500 transition-colors placeholder-gray-400 font-mono uppercase"
              placeholder="SCAN OR TYPE SKU..."
            />
          </div>
          <button
            type="submit"
            disabled={!skuInput.trim()}
            className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            Enter
          </button>
        </form>
      </div>

      {/* Scanned Batch List */}
      {scannedItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 flex items-center">
              <Package className="w-5 h-5 mr-2 text-indigo-500" />
              Current Batch ({scannedItems.reduce((acc, item) => acc + item.quantity, 0)} units)
            </h3>
          </div>
          
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {scannedItems.map((item) => (
              <div key={item.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <p className="font-mono font-bold text-gray-900 text-lg">{item.sku}</p>
                  <p className="text-sm text-gray-500">{item.name}</p>
                </div>
                
                <div className="flex items-center space-x-6">
                  {/* Quantity Adjuster */}
                  <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-white rounded-md transition-all">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-gray-900 w-8 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-white rounded-md transition-all">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Delete Button */}
                  <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 p-2">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 sm:px-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full flex items-center justify-center py-4 px-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition-colors disabled:opacity-70 disabled:cursor-wait"
            >
              {isSyncing ? (
                'Syncing to Database...'
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Confirm & Sync Inventory
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {scannedItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <div className="bg-indigo-100 p-4 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Ready to receive</h3>
          <p className="text-gray-500 max-w-sm">Scan your first item to begin building the inbound inventory batch.</p>
        </div>
      )}
    </div>
  );
}