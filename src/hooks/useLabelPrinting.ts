import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import type { LabelTemplate, PrinterConfig, PrintJob } from '@/types/labelDesigner'
import { ZPLGenerator } from '@/utils/zplGenerator'

export function useLabelPrinting() {
  const [templates, setTemplates] = useState<LabelTemplate[]>([])
  const [printers, setPrinters] = useState<PrinterConfig[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch all templates
  const fetchTemplates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('label_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load label templates')
    }
  }, [])

  // Fetch active printers
  const fetchPrinters = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('printer_configs')
        .select('*')
        .eq('is_active', true)
        .order('location', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error
      setPrinters(data || [])
    } catch (error) {
      console.error('Error fetching printers:', error)
      toast.error('Failed to load printer configurations')
    }
  }, [])

  // Save a new template
  const saveTemplate = useCallback(async (template: Partial<LabelTemplate>) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('label_templates')
        .insert(template)
        .select()
        .single()

      if (error) throw error
      
      await fetchTemplates() // Refresh list
      toast.success('Template saved successfully')
      return data
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [fetchTemplates])

  // Update template
  const updateTemplate = useCallback(async (id: string, updates: Partial<LabelTemplate>) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('label_templates')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      
      await fetchTemplates()
      toast.success('Template updated successfully')
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('Failed to update template')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [fetchTemplates])

  // Delete template
  const deleteTemplate = useCallback(async (id: string) => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('label_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      await fetchTemplates()
      toast.success('Template deleted successfully')
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [fetchTemplates])

  // Generate ZPL from template and data
  const generateZPL = useCallback(async (
    template: LabelTemplate, 
    dynamicData: Record<string, any>
  ): Promise<string> => {
    try {
      // Parse canvas data
      const canvasData = JSON.parse(template.canvas_data)
      
      // Create temporary canvas
      const tempCanvas = document.createElement('canvas')
      const fabricCanvas = new (window as any).fabric.Canvas(tempCanvas)
      
      // Load canvas data
      await new Promise<void>((resolve) => {
        fabricCanvas.loadFromJSON(canvasData, () => {
          fabricCanvas.renderAll()
          resolve()
        })
      })

      // Generate ZPL
      const dpi = 203 // Standard Zebra printer DPI
      const labelWidth = ZPLGenerator.convertToDots(
        template.label_size.width,
        template.label_size.unit,
        dpi
      )
      const labelHeight = ZPLGenerator.convertToDots(
        template.label_size.height,
        template.label_size.unit,
        dpi
      )

      const generator = new ZPLGenerator({
        dpi,
        labelWidth,
        labelHeight
      })

      const zpl = await generator.generateFromCanvas(fabricCanvas, dynamicData)
      
      // Cleanup
      fabricCanvas.dispose()
      
      return zpl
    } catch (error) {
      console.error('Error generating ZPL:', error)
      throw error
    }
  }, [])

  // Print label
  const printLabel = useCallback(async (
    templateId: string,
    printerId: string,
    dynamicData: Record<string, any>,
    quantity: number = 1
  ) => {
    setIsLoading(true)
    try {
      // Get template
      const template = templates.find(t => t.id === templateId)
      if (!template) throw new Error('Template not found')

      // Get printer
      const printer = printers.find(p => p.id === printerId)
      if (!printer) throw new Error('Printer not found')

      // Generate ZPL
      const zpl = await generateZPL(template, dynamicData)

      // Create print job record
      const { data: printJob, error: jobError } = await supabase
        .from('print_jobs')
        .insert({
          template_id: templateId,
          printer_id: printerId,
          data: dynamicData,
          zpl_content: zpl,
          quantity,
          status: 'pending'
        })
        .select()
        .single()

      if (jobError) throw jobError

      // Send to printer (via NPS or direct)
      if (printer.nps_url) {
        // Send to Network Print Server
        const response = await fetch(printer.nps_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            printer_ip: printer.ip_address,
            printer_port: printer.port,
            zpl_data: zpl,
            quantity,
            job_id: printJob.id
          })
        })

        if (!response.ok) {
          throw new Error('Failed to send print job to NPS')
        }

        // Update job status
        await supabase
          .from('print_jobs')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', printJob.id)

        toast.success(`Sent ${quantity} label(s) to ${printer.name}`)
      } else {
        // For now, just download the ZPL file
        const blob = new Blob([zpl], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `label_${printJob.id}.zpl`
        a.click()
        URL.revokeObjectURL(url)
        
        toast.success('ZPL file downloaded - configure NPS for direct printing')
      }

      // Update template usage stats
      await supabase
        .from('template_usage_stats')
        .upsert({
          template_id: templateId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          usage_count: 1,
          last_used_at: new Date().toISOString()
        }, {
          onConflict: 'template_id,user_id',
          count: 'exact'
        })

    } catch (error) {
      console.error('Error printing label:', error)
      toast.error('Failed to print label')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [templates, printers, generateZPL])

  // Fetch data on mount
  useEffect(() => {
    fetchTemplates()
    fetchPrinters()
  }, [fetchTemplates, fetchPrinters])

  return {
    templates,
    printers,
    isLoading,
    saveTemplate,
    updateTemplate,
    deleteTemplate,
    generateZPL,
    printLabel,
    refreshTemplates: fetchTemplates,
    refreshPrinters: fetchPrinters
  }
}