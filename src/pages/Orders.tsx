import { useState } from 'react'
import { OrderCard } from '@/components/orders/OrderCard'
import { OrderRowCard } from '@/components/orders/OrderRowCard'
import { CTNumberModal } from '@/components/orders/CTNumberModal'
import { OrderCreationModal } from '@/components/orders/OrderCreationModal'
import { OrderImportModal } from '@/components/orders/OrderImportModal'
import { WhatsAppModal } from '@/components/orders/WhatsAppModal'
import { ImageViewerModal } from '@/components/orders/ImageViewerModal'
import { FAIUploadModal } from '@/components/orders/FAIUploadModal'
import { MasterImageUploadModal } from '@/components/orders/MasterImageUploadModal'
import { LabelPrintModal } from '@/components/orders/LabelPrintModal'
import { QuickPrintModal } from '@/components/orders/QuickPrintModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  RefreshCw,
  Calendar,
  Package,
  AlertCircle,
  Grid3X3,
  List,
  Upload,
  Printer
} from 'lucide-react'
import { useOrders, useOrderStats, OrderLineWithDetails } from '@/hooks/useOrders'

type ViewMode = 'cards' | 'rows'

export function Orders() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('rows')
  const [ctModalOpen, setCTModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<OrderLineWithDetails | null>(null)
  const [createOrderModalOpen, setCreateOrderModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false)
  const [whatsAppOrder, setWhatsAppOrder] = useState<OrderLineWithDetails | null>(null)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [imageViewerPartNumber, setImageViewerPartNumber] = useState('')
  const [faiUploadOpen, setFAIUploadOpen] = useState(false)
  const [masterImageUploadOpen, setMasterImageUploadOpen] = useState(false)
  const [uploadPartNumber, setUploadPartNumber] = useState('')
  const [labelPrintOrderId, setLabelPrintOrderId] = useState<string | null>(null)
  const [quickPrintOpen, setQuickPrintOpen] = useState(false)
  
  // Fetch orders and stats from database
  const { data: orders = [], isLoading, error, refetch } = useOrders()
  const { totalOrders, pendingTotal, inQCTotal, completedTotal } = useOrderStats()

  // CT Modal handlers
  const handleManageCT = (order: OrderLineWithDetails) => {
    setSelectedOrder(order)
    setCTModalOpen(true)
  }

  const handleCTSave = async (ctNumbers: string[]) => {
    if (!selectedOrder) return
    
    try {
      console.log('✅ CT numbers saved for order:', selectedOrder.uid, ctNumbers.length, 'CTs')
      
      // The actual database save is handled by the CTNumberModal via useSaveCTNumbers hook
      // This callback just handles UI state cleanup
      
      setCTModalOpen(false)
      setSelectedOrder(null)
    } catch (error) {
      console.error('Failed to save CT numbers:', error)
    }
  }

  // Order creation handlers
  const handleCreateOrder = () => {
    setCreateOrderModalOpen(true)
  }

  const handleOrderCreated = (orderUid: string) => {
    console.log('✅ New order created:', orderUid)
    // Modal will close automatically, orders list will refresh via real-time subscription
  }

  // Import handlers
  const handleImportOrders = () => {
    setImportModalOpen(true)
  }

  const handleImportComplete = (importedCount: number) => {
    console.log('✅ Import completed:', importedCount, 'orders imported')
    // Modal will close automatically, orders list will refresh via real-time subscription
    setImportModalOpen(false)
  }

  // WhatsApp handlers
  const handleWhatsApp = (order: OrderLineWithDetails) => {
    setWhatsAppOrder(order)
    setWhatsAppModalOpen(true)
  }

  const handlePrintLabel = (order: OrderLineWithDetails) => {
    setLabelPrintOrderId(order.id)
  }

  // FAI Image handlers
  const handleViewImages = (order: OrderLineWithDetails) => {
    setImageViewerPartNumber(order.customer_part_number)
    setImageViewerOpen(true)
  }

  const handleUploadFAI = (partNumber: string) => {
    setUploadPartNumber(partNumber)
    setFAIUploadOpen(true)
  }

  const handleUploadMasterImage = (partNumber: string) => {
    setUploadPartNumber(partNumber)
    setMasterImageUploadOpen(true)
  }

  // Filter orders based on search and filter
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.uid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_part_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.bpi_description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'pending' && (order.quantities?.pending_procurement || 0) > 0) ||
      (selectedFilter === 'qc' && (order.quantities?.in_screening_qc || 0) > 0) ||
      (selectedFilter === 'completed' && (order.quantities?.qc_passed_ready_invoice || 0) > 0)

    return matchesSearch && matchesFilter
  })

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" message="Loading orders..." />
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h3 className="text-lg font-medium text-gray-900">Failed to load orders</h3>
        <p className="text-sm text-gray-500">{error.message}</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-600">
            Manage and track all order processing
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-0.5 bg-gray-100 rounded-lg p-0.5">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="px-2 py-1 text-xs"
            >
              <Grid3X3 className="h-3.5 w-3.5 mr-1" />
              Cards
            </Button>
            <Button
              variant={viewMode === 'rows' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('rows')}
              className="px-2 py-1 text-xs"
            >
              <List className="h-3.5 w-3.5 mr-1" />
              Rows
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs px-2"
            onClick={() => setQuickPrintOpen(true)}
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Quick Print
          </Button>
          <Button variant="outline" size="sm" className="text-xs px-2">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="text-xs px-2" onClick={handleImportOrders}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Import
          </Button>
          <Button size="sm" className="text-xs px-2" onClick={handleCreateOrder}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Order
          </Button>
        </div>
      </div>

      {/* Compact Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Total Orders</p>
              <p className="text-xl font-bold">{totalOrders}</p>
            </div>
            <Package className="h-6 w-6 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Pending</p>
              <p className="text-xl font-bold text-amber-600">{pendingTotal}</p>
            </div>
            <Calendar className="h-6 w-6 text-amber-400" />
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">In QC</p>
              <p className="text-xl font-bold text-blue-600">{inQCTotal}</p>
            </div>
            <RefreshCw className="h-6 w-6 text-blue-400" />
          </div>
        </div>
        <div className="bg-white p-3 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600">Completed</p>
              <p className="text-xl font-bold text-green-600">{completedTotal}</p>
            </div>
            <Package className="h-6 w-6 text-green-400" />
          </div>
        </div>
      </div>

      {/* Compact Search and Filters */}
      <div className="bg-white p-3 rounded-lg border">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by UID, part number, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm h-8"
            />
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('all')}
              className="text-xs px-2 py-1"
            >
              All
            </Button>
            <Button
              variant={selectedFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('pending')}
              className="text-xs px-2 py-1"
            >
              Pending
            </Button>
            <Button
              variant={selectedFilter === 'qc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('qc')}
              className="text-xs px-2 py-1"
            >
              In QC
            </Button>
            <Button
              variant={selectedFilter === 'completed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('completed')}
              className="text-xs px-2 py-1"
            >
              Completed
            </Button>
          </div>
          <Button variant="outline" size="sm" className="text-xs px-2 py-1">
            <Filter className="mr-1.5 h-3.5 w-3.5" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Orders Display */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onPrintLabel={() => handlePrintLabel(order)}
              onManageCT={() => handleManageCT(order)}
              onUpdateStatus={() => console.log('Update status for', order.uid)}
              onViewImages={() => handleViewImages(order)}
              onProcurementQuery={() => console.log('Procurement query for', order.uid)}
              onWhatsApp={() => handleWhatsApp(order)}
              onRequestCancel={() => console.log('Request cancel for', order.uid)}
              onViewHistory={() => console.log('View history for', order.uid)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map((order) => (
            <OrderRowCard
              key={order.id}
              order={order}
              onPrintLabel={() => handlePrintLabel(order)}
              onManageCT={() => handleManageCT(order)}
              onUpdateStatus={() => console.log('Update status for', order.uid)}
              onViewImages={() => handleViewImages(order)}
              onProcurementQuery={() => console.log('Procurement query for', order.uid)}
              onWhatsApp={() => handleWhatsApp(order)}
              onRequestCancel={() => console.log('Request cancel for', order.uid)}
              onViewHistory={() => console.log('View history for', order.uid)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredOrders.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">
            {searchQuery || selectedFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'No orders available. Create your first order to get started.'}
          </p>
          {!searchQuery && selectedFilter === 'all' && (
            <Button className="mt-4" size="sm" onClick={handleCreateOrder}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Order
            </Button>
          )}
        </div>
      )}

      {/* Real-time Connection Status */}
      {orders.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                <div className="h-2 w-2 rounded-full bg-green-600 animate-pulse"></div>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">
                🔄 Live real-time updates enabled - Changes appear instantly across all connected clients
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CT Number Management Modal */}
      {selectedOrder && (
        <CTNumberModal
          isOpen={ctModalOpen}
          onClose={() => {
            setCTModalOpen(false)
            setSelectedOrder(null)
          }}
          orderLine={selectedOrder}
          onSave={handleCTSave}
        />
      )}

      {/* Order Creation Modal */}
      <OrderCreationModal
        isOpen={createOrderModalOpen}
        onClose={() => setCreateOrderModalOpen(false)}
        onSuccess={handleOrderCreated}
      />

      {/* Order Import Modal */}
      <OrderImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />

      {/* WhatsApp Modal */}
      {whatsAppOrder && (
        <WhatsAppModal
          isOpen={whatsAppModalOpen}
          onClose={() => {
            setWhatsAppModalOpen(false)
            setWhatsAppOrder(null)
          }}
          orderLineId={whatsAppOrder.uid}
          orderData={{
            uid: whatsAppOrder.uid,
            customerName: whatsAppOrder.customer?.name || 'Unknown',
            customerPartNumber: whatsAppOrder.customer_part_number,
            bpiDescription: whatsAppOrder.bpi_description || '',
            orderQuantity: whatsAppOrder.order_quantity,
            currentStatus: whatsAppOrder.quantities?.in_screening_qc ? 'In QC' : 'Pending'
          }}
        />
      )}

      {/* Image Viewer Modal */}
      <ImageViewerModal
        customer_part_number={imageViewerPartNumber}
        isOpen={imageViewerOpen}
        onClose={() => {
          setImageViewerOpen(false)
          setImageViewerPartNumber('')
        }}
      />

      {/* FAI Upload Modal */}
      <FAIUploadModal
        customer_part_number={uploadPartNumber}
        isOpen={faiUploadOpen}
        onClose={() => {
          setFAIUploadOpen(false)
          setUploadPartNumber('')
        }}
        onUploadSuccess={(document) => {
          console.log('✅ FAI document uploaded:', document.filename)
          // Optionally refresh or show notification
        }}
      />

      {/* Master Image Upload Modal */}
      <MasterImageUploadModal
        customer_part_number={uploadPartNumber}
        isOpen={masterImageUploadOpen}
        onClose={() => {
          setMasterImageUploadOpen(false)
          setUploadPartNumber('')
        }}
        onUploadSuccess={(image) => {
          console.log('✅ Master image uploaded:', image.image_name)
          // Optionally refresh or show notification
        }}
      />

      {/* Label Print Modal */}
      <LabelPrintModal
        isOpen={!!labelPrintOrderId}
        onClose={() => setLabelPrintOrderId(null)}
        order={orders.find(o => o.id === labelPrintOrderId) || null}
      />

      {/* Quick Print Modal */}
      <QuickPrintModal
        isOpen={quickPrintOpen}
        onClose={() => setQuickPrintOpen(false)}
      />
    </div>
  )
}