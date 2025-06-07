import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  ChevronDown,
  ChevronUp,
  Printer,
  Hash,
  RotateCcw,
  Image,
  MessageSquare,
  Search,
  X,
  History,
  Calendar,
  User,
  Package,
  Building2
} from 'lucide-react'
import { OrderLineWithDetails } from '@/hooks/useOrders'

interface OrderRowCardProps {
  order: OrderLineWithDetails
  onPrintLabel: () => void
  onManageCT: () => void
  onUpdateStatus: () => void
  onViewImages: () => void
  onProcurementQuery: () => void
  onWhatsApp: () => void
  onRequestCancel: () => void
  onViewHistory: () => void
}

export function OrderRowCard({
  order,
  onPrintLabel,
  onManageCT,
  onUpdateStatus,
  onViewImages,
  onProcurementQuery,
  onWhatsApp,
  onRequestCancel,
  onViewHistory
}: OrderRowCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate progress percentage for the quantity bar
  const quantities = order.quantities
  const totalQuantity = quantities?.total_order_quantity || order.order_quantity
  const completedQuantity = quantities?.qc_passed_ready_invoice || 0
  const inProgressQuantity = (quantities?.in_screening_qc || 0) + (quantities?.in_kitting_packing || 0)
  const pendingQuantity = quantities?.pending_procurement || 0

  const progressPercentage = totalQuantity > 0 ? (completedQuantity / totalQuantity) * 100 : 0

  // ETA status styling
  const getEtaStatusStyle = () => {
    const status = order.currentEtaStatus
    const baseClasses = "px-1.5 py-0.5 rounded-full text-[10px] font-medium"
    
    if (order.isBlinking) {
      return `${baseClasses} bg-red-100 text-red-800 animate-pulse`
    }
    
    switch (status) {
      case 'first':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'second':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'third':
        return `${baseClasses} bg-orange-100 text-orange-800`
      case 'final':
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  return (
    <Card className="w-full transition-all duration-200 hover:shadow-md">
      {/* Main Row Content */}
      <div className="p-3">
        <div className="flex items-center justify-between">
          {/* Left Section - Core Info */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* UID and Status */}
            <div className="flex flex-col items-center space-y-1">
              <Badge variant="outline" className="font-mono text-xs">
                {order.uid}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                QC
              </Badge>
            </div>

            {/* Part Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate">
                  {order.customer_part_number}
                </h3>
                <div className={getEtaStatusStyle()}>
                  {order.current_eta}
                </div>
              </div>
              <p className="text-xs text-gray-600 truncate mb-0.5">
                {order.bpi_description}
              </p>
              <p className="text-[10px] text-gray-500 truncate">
                {order.customer_description}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-28 space-y-0.5">
              <div className="flex justify-between text-[10px] text-gray-500">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-amber-600">{pendingQuantity} Pending</span>
                <span className="text-blue-600">{inProgressQuantity} QC</span>
                <span className="text-green-600">{completedQuantity} Done</span>
              </div>
            </div>

            {/* Global Pending */}
            <div className="text-center">
              <div className="text-base font-bold text-orange-600">
                {order.globalPendingForHP}
              </div>
              <div className="text-[10px] text-gray-500">Left</div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center space-x-2 ml-4">
            {/* Compact Action Buttons */}
            <Button variant="outline" size="sm" onClick={onPrintLabel} title="Print Label" className="h-7 w-7 p-0">
              <Printer className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={onManageCT} title="CT Numbers" className="h-7 w-7 p-0">
              <Hash className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={onUpdateStatus} title="Update Status" className="h-7 w-7 p-0">
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={onViewImages} title="View Images">
              <Image className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onWhatsApp} title="WhatsApp">
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onProcurementQuery} title="Procurement">
              <Search className="h-4 w-4" />
            </Button>

            {/* Expand/Collapse Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t bg-gray-50 p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Order Details */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Order Details
              </h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">PO Number:</span>
                  <span className="font-mono">{order.po_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">PO Date:</span>
                  <span>{order.po_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Qty:</span>
                  <span className="font-semibold">{order.order_quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Category:</span>
                  <span>{order.category_name}</span>
                </div>
              </div>
            </div>

            {/* Customer & Assignment */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                Customer & Team
              </h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Lead Time:</span>
                  <span>{order.lead_time || 'TBD'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Assigned:</span>
                  <span className="text-xs text-gray-400">None</span>
                </div>
              </div>
            </div>

            {/* Additional Actions */}
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900 flex items-center">
                <History className="h-4 w-4 mr-2" />
                More Actions
              </h4>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={onViewHistory}>
                  <History className="h-3 w-3 mr-1" />
                  History
                </Button>
                <Button variant="outline" size="sm" onClick={onRequestCancel}>
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
                <Button variant="outline" size="sm">
                  <User className="h-3 w-3 mr-1" />
                  Assign
                </Button>
                <Button variant="outline" size="sm">
                  <Calendar className="h-3 w-3 mr-1" />
                  ETA
                </Button>
              </div>
            </div>
          </div>

          {/* Detailed Quantity Breakdown */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-2">Quantity Breakdown</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              <div className="text-center p-2 bg-amber-50 rounded">
                <div className="font-semibold text-amber-600">{quantities?.pending_procurement || 0}</div>
                <div className="text-xs text-amber-700">Pending Proc</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <div className="font-semibold text-blue-600">{quantities?.in_screening_qc || 0}</div>
                <div className="text-xs text-blue-700">In QC</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-semibold text-green-600">{quantities?.qc_passed_ready_invoice || 0}</div>
                <div className="text-xs text-green-700">Ready Invoice</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold text-gray-600">{quantities?.cancelled || 0}</div>
                <div className="text-xs text-gray-700">Cancelled</div>
              </div>
              <div className="text-center p-2 bg-purple-50 rounded">
                <div className="font-semibold text-purple-600">{quantities?.total_order_quantity || 0}</div>
                <div className="text-xs text-purple-700">Total</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}