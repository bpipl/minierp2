import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Save, 
  XCircle, 
  Calendar,
  Package,
  Building,
  FileText,
  Loader2
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCreateOrder } from '@/hooks/useCreateOrder'
import { OrderLineFormData } from '@/types'
import { cn } from '@/lib/utils'

interface OrderCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (orderUid: string) => void
}

export function OrderCreationModal({ isOpen, onClose, onSuccess }: OrderCreationModalProps) {
  const [formData, setFormData] = useState<OrderLineFormData>({
    customer_id: '',
    customer_part_number: '',
    product_category_id: '',
    order_quantity: 1,
    po_number: '',
    po_date: '',
    core_part_number: '',
    customer_description: '',
    bpi_description: '',
    price: undefined,
    lead_time: '',
    current_eta: '',
    vid: '',
    msc: '',
    misc_field_1: '',
    misc_field_2: '',
    misc_field_3: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { user } = useAuth()
  const { 
    customers, 
    categories, 
    createOrder, 
    isLoading: isCreating,
    error: createError 
  } = useCreateOrder()

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        customer_id: '',
        customer_part_number: '',
        product_category_id: '',
        order_quantity: 1,
        po_number: '',
        po_date: '',
        core_part_number: '',
        customer_description: '',
        bpi_description: '',
        price: undefined,
        lead_time: '',
        current_eta: '',
        vid: '',
        msc: '',
        misc_field_1: '',
        misc_field_2: '',
        misc_field_3: ''
      })
      setErrors({})
      setIsSubmitting(false)
    }
  }, [isOpen])

  // Handle input changes
  const handleInputChange = (field: keyof OrderLineFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.customer_id) {
      newErrors.customer_id = 'Customer is required'
    }
    if (!formData.customer_part_number.trim()) {
      newErrors.customer_part_number = 'Customer part number is required'
    }
    if (!formData.product_category_id) {
      newErrors.product_category_id = 'Product category is required'
    }
    if (!formData.order_quantity || formData.order_quantity < 1) {
      newErrors.order_quantity = 'Order quantity must be at least 1'
    }

    // Date format validation (DDMMYY)
    const datePattern = /^\d{6}$/
    if (formData.po_date && !datePattern.test(formData.po_date)) {
      newErrors.po_date = 'Date must be in DDMMYY format (e.g., 061224)'
    }
    if (formData.current_eta && !datePattern.test(formData.current_eta)) {
      newErrors.current_eta = 'ETA must be in DDMMYY format (e.g., 151224)'
    }

    // Price validation
    if (formData.price !== undefined && formData.price < 0) {
      newErrors.price = 'Price cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm() || !user?.id) return

    setIsSubmitting(true)
    try {
      const orderUid = await createOrder({
        ...formData,
        created_by: user.id
      })
      
      onSuccess(orderUid)
      onClose()
    } catch (error) {
      console.error('Failed to create order:', error)
      // Error is handled by the hook
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get today's date in DDMMYY format
  const getTodayDDMMYY = (): string => {
    const today = new Date()
    const day = today.getDate().toString().padStart(2, '0')
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const year = today.getFullYear().toString().slice(-2)
    return `${day}${month}${year}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Create New Order</span>
          </DialogTitle>
          <DialogDescription>
            Fill in the order details below. Required fields are marked with an asterisk (*).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create Error */}
          {createError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-700">{createError}</span>
              </div>
            </div>
          )}

          {/* Customer & Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Building className="h-4 w-4 mr-2" />
                Customer Information
              </h3>
              
              <div>
                <Label htmlFor="customer">Customer *</Label>
                <select
                  id="customer"
                  value={formData.customer_id}
                  onChange={(e) => handleInputChange('customer_id', e.target.value)}
                  className={cn(
                    "w-full mt-1 px-3 py-2 border rounded-md text-sm",
                    errors.customer_id ? "border-red-300" : "border-gray-300"
                  )}
                >
                  <option value="">Select a customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
                {errors.customer_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.customer_id}</p>
                )}
              </div>

              <div>
                <Label htmlFor="po_number">PO Number</Label>
                <Input
                  id="po_number"
                  placeholder="Purchase Order Number"
                  value={formData.po_number}
                  onChange={(e) => handleInputChange('po_number', e.target.value)}
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="po_date">PO Date (DDMMYY)</Label>
                <div className="relative">
                  <Input
                    id="po_date"
                    placeholder={`e.g., ${getTodayDDMMYY()}`}
                    value={formData.po_date}
                    onChange={(e) => handleInputChange('po_date', e.target.value)}
                    className={cn(
                      "text-sm pr-8",
                      errors.po_date ? "border-red-300" : ""
                    )}
                    maxLength={6}
                  />
                  <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                {errors.po_date && (
                  <p className="text-red-500 text-xs mt-1">{errors.po_date}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Package className="h-4 w-4 mr-2" />
                Part Information
              </h3>

              <div>
                <Label htmlFor="customer_part_number">Customer Part Number *</Label>
                <Input
                  id="customer_part_number"
                  placeholder="Part number from customer"
                  value={formData.customer_part_number}
                  onChange={(e) => handleInputChange('customer_part_number', e.target.value)}
                  className={cn(
                    "text-sm font-mono",
                    errors.customer_part_number ? "border-red-300" : ""
                  )}
                />
                {errors.customer_part_number && (
                  <p className="text-red-500 text-xs mt-1">{errors.customer_part_number}</p>
                )}
              </div>

              <div>
                <Label htmlFor="core_part_number">Core Part Number</Label>
                <Input
                  id="core_part_number"
                  placeholder="Internal/core part number"
                  value={formData.core_part_number}
                  onChange={(e) => handleInputChange('core_part_number', e.target.value)}
                  className="text-sm font-mono"
                />
              </div>

              <div>
                <Label htmlFor="product_category">Product Category *</Label>
                <select
                  id="product_category"
                  value={formData.product_category_id}
                  onChange={(e) => handleInputChange('product_category_id', e.target.value)}
                  className={cn(
                    "w-full mt-1 px-3 py-2 border rounded-md text-sm",
                    errors.product_category_id ? "border-red-300" : "border-gray-300"
                  )}
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.product_category_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.product_category_id}</p>
                )}
              </div>
            </div>
          </div>

          {/* Descriptions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Descriptions
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer_description">Customer Description</Label>
                <Input
                  id="customer_description"
                  placeholder="Description from customer"
                  value={formData.customer_description}
                  onChange={(e) => handleInputChange('customer_description', e.target.value)}
                  className="text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="bpi_description">BPI Description</Label>
                <Input
                  id="bpi_description"
                  placeholder="Internal BPI description"
                  value={formData.bpi_description}
                  onChange={(e) => handleInputChange('bpi_description', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="order_quantity">Order Quantity *</Label>
              <Input
                id="order_quantity"
                type="number"
                min="1"
                placeholder="1"
                value={formData.order_quantity}
                onChange={(e) => handleInputChange('order_quantity', parseInt(e.target.value) || 0)}
                className={cn(
                  "text-sm",
                  errors.order_quantity ? "border-red-300" : ""
                )}
              />
              {errors.order_quantity && (
                <p className="text-red-500 text-xs mt-1">{errors.order_quantity}</p>
              )}
            </div>

            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.price || ''}
                onChange={(e) => handleInputChange('price', e.target.value ? parseFloat(e.target.value) : undefined)}
                className={cn(
                  "text-sm",
                  errors.price ? "border-red-300" : ""
                )}
              />
              {errors.price && (
                <p className="text-red-500 text-xs mt-1">{errors.price}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lead_time">Lead Time</Label>
              <Input
                id="lead_time"
                placeholder="e.g., 2-3 weeks"
                value={formData.lead_time}
                onChange={(e) => handleInputChange('lead_time', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* ETA & References */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="current_eta">Current ETA (DDMMYY)</Label>
              <div className="relative">
                <Input
                  id="current_eta"
                  placeholder={`e.g., 151224`}
                  value={formData.current_eta}
                  onChange={(e) => handleInputChange('current_eta', e.target.value)}
                  className={cn(
                    "text-sm pr-8",
                    errors.current_eta ? "border-red-300" : ""
                  )}
                  maxLength={6}
                />
                <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.current_eta && (
                <p className="text-red-500 text-xs mt-1">{errors.current_eta}</p>
              )}
            </div>

            <div>
              <Label htmlFor="vid">VID</Label>
              <Input
                id="vid"
                placeholder="Vendor ID"
                value={formData.vid}
                onChange={(e) => handleInputChange('vid', e.target.value)}
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="msc">MSC</Label>
              <Input
                id="msc"
                placeholder="MSC Code"
                value={formData.msc}
                onChange={(e) => handleInputChange('msc', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Misc Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="misc_field_1">Misc Field 1</Label>
              <Input
                id="misc_field_1"
                placeholder="Additional field 1"
                value={formData.misc_field_1}
                onChange={(e) => handleInputChange('misc_field_1', e.target.value)}
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="misc_field_2">Misc Field 2</Label>
              <Input
                id="misc_field_2"
                placeholder="Additional field 2"
                value={formData.misc_field_2}
                onChange={(e) => handleInputChange('misc_field_2', e.target.value)}
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="misc_field_3">Misc Field 3</Label>
              <Input
                id="misc_field_3"
                placeholder="Additional field 3"
                value={formData.misc_field_3}
                onChange={(e) => handleInputChange('misc_field_3', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500">
              <span>Required fields are marked with *</span>
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || isCreating}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting || isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Order
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}