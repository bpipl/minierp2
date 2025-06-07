import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Printer, 
  Hash, 
  Image, 
  MessageSquare, 
  Clock,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  X,
  History
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { OrderLineWithDetails } from '@/hooks/useOrders'

interface OrderCardProps {
  order: OrderLineWithDetails
  onPrintLabel: () => void
  onManageCT: () => void
  onUpdateStatus: () => void
  onViewImages: () => void
  onProcurementQuery: () => void
  onWhatsApp: () => void
  onRequestCancel: () => void
  onViewHistory: () => void
  onDesignLabel?: () => void
}

// ETA status color mapping
const etaStatusColors = {
  rfq: 'bg-gray-100 text-gray-700',
  first: 'bg-green-100 text-green-700',
  second: 'bg-yellow-100 text-yellow-700',
  third: 'bg-red-100 text-red-700',
  final: 'bg-red-100 text-red-700',
  overdue: 'bg-red-200 text-red-800'
}

// Status badge colors
const statusColors = {
  pending: 'bg-gray-100 text-gray-700',
  qc: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700'
}

export function OrderCard({
  order,
  onPrintLabel,
  onManageCT,
  onUpdateStatus,
  onViewImages,
  onProcurementQuery,
  onWhatsApp,
  onRequestCancel,
  onViewHistory
}: OrderCardProps) {
  // Sample data for demonstration
  const quantities = order.quantities || {
    total_order_quantity: 10,
    pending_procurement: 3,
    in_screening_qc: 1,
    qc_passed_ready_invoice: 4,
    cancelled: 2
  }

  const totalProcessed = quantities.qc_passed_ready_invoice || 0
  const totalCancelled = quantities.cancelled || 0
  const totalPending = quantities.pending_procurement || 0
  const totalInQC = quantities.in_screening_qc || 0

  // Calculate progress for future use
  // const progressPercentage = (quantities.total_order_quantity || 0) > 0
  //   ? ((totalProcessed / (quantities.total_order_quantity || 1)) * 100)
  //   : 0

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-start justify-between">
          {/* Left side - UID, Part Number */}
          <div className="flex items-center space-x-3">
            <div className="text-base font-bold text-gray-900">
              {order.uid || 'A001'}
            </div>
            <div className="text-xs text-gray-600">
              {order.customer_part_number || 'L12345-601'}
            </div>
          </div>

          {/* Right side - Status Badge */}
          <div className="flex items-center">
            <Badge variant="secondary" className={cn(
              order.quantities?.in_screening_qc ? statusColors.qc : statusColors.pending
            )}>
              {order.quantities?.in_screening_qc ? 'QC' : 'Pending'}
            </Badge>
          </div>
        </div>

        {/* Title/Description */}
        <div className="mt-2">
          <h3 className="text-sm font-medium text-gray-900">
            {order.bpi_description || 'Laptop 840 G10 LCD'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {order.customer_description || 'EliteBook 840 G10 LCD Screen 14"'}
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-2">
        {/* Key Dates and Info */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            <div>
              <span className="text-gray-500">PO Date:</span>
              <span className="ml-1 font-medium">{order.po_date || '150124'}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500">ETA:</span>
              <div className={cn(
                "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium inline-flex items-center",
                etaStatusColors[order.currentEtaStatus || 'rfq'],
                order.isBlinking && "animate-pulse"
              )}>
                <Clock className="h-2.5 w-2.5 mr-0.5" />
                {order.current_eta || '220124'}
              </div>
            </div>
          </div>
          {order.po_number && (
            <div className="text-xs text-gray-500">
              PO: {order.po_number}
            </div>
          )}
        </div>

        {/* Progressive Quantity Bar */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500">Progress</span>
            <span className="text-[10px] text-gray-500">
              {totalProcessed} of {quantities.total_order_quantity}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className="h-full flex">
              {/* Completed portion */}
              <div 
                className="bg-green-500 transition-all duration-300"
                style={{ width: `${(totalProcessed / (quantities.total_order_quantity || 1)) * 100}%` }}
              />
              {/* In QC portion */}
              <div 
                className="bg-blue-500 transition-all duration-300"
                style={{ width: `${(totalInQC / (quantities.total_order_quantity || 1)) * 100}%` }}
              />
              {/* Cancelled portion */}
              <div 
                className="bg-red-500 transition-all duration-300"
                style={{ width: `${(totalCancelled / (quantities.total_order_quantity || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quantity Tags/Badges */}
        <div className="flex flex-wrap gap-2">
          {totalPending > 0 && (
            <Badge variant="outline" className="text-[10px] py-0.5 px-1.5">
              <AlertCircle className="h-2.5 w-2.5 mr-0.5" />
              {totalPending} Pending
            </Badge>
          )}
          {totalInQC > 0 && (
            <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 py-0.5 px-1.5">
              <Package className="h-2.5 w-2.5 mr-0.5" />
              {totalInQC} QC
            </Badge>
          )}
          {totalProcessed > 0 && (
            <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 py-0.5 px-1.5">
              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
              {totalProcessed} Completed
            </Badge>
          )}
          {totalCancelled > 0 && (
            <Badge variant="outline" className="text-[10px] text-red-600 border-red-200 py-0.5 px-1.5">
              <XCircle className="h-2.5 w-2.5 mr-0.5" />
              {totalCancelled} Cancelled
            </Badge>
          )}
        </div>

        {/* Global Pending for HP Display */}
        {order.globalPendingForHP !== undefined && order.globalPendingForHP > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
            <span className="text-sm font-medium text-amber-800">
              Global Pending: {order.globalPendingForHP} left
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-4 gap-1 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onPrintLabel}
            className="text-xs px-2"
            title="Print Label"
          >
            <Printer className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onManageCT}
            className="text-xs px-2"
            title="CT Numbers"
          >
            <Hash className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onUpdateStatus}
            className="text-xs px-2"
            title="Update Status"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onViewImages}
            className="text-xs px-2"
            title="View Images"
          >
            <Image className="h-3 w-3" />
          </Button>
        </div>

        {/* Secondary Action Buttons */}
        <div className="grid grid-cols-4 gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={onWhatsApp}
            className="text-xs px-2"
            title="WhatsApp"
          >
            <MessageSquare className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onProcurementQuery}
            className="text-xs px-2"
            title="Procurement"
          >
            <Search className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onViewHistory}
            className="text-xs px-2"
            title="View History"
          >
            <History className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRequestCancel}
            className="text-xs px-2"
            title="Request Cancel"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}