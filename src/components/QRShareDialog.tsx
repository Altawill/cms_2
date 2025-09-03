import React from 'react'
import { Button } from './ui/button'
import { QrCode } from 'lucide-react'

interface QRShareDialogProps {
  isOpen: boolean
  onClose: () => void
  entityType: 'TASK' | 'APPROVAL' | 'REPORT' | 'SITE'
  entityId: string
  entityTitle: string
  entityTitleAr?: string
  siteId?: string
  metadata?: Record<string, any>
}

export default function QRShareDialog(props: QRShareDialogProps) {
  // Temporary stub - functionality disabled until deepLinksService is restored
  return null
}

// Quick share button component
export function QuickShareButton({
  entityType,
  entityId,
  entityTitle,
  entityTitleAr,
  siteId,
  metadata,
  size = "sm",
  variant = "outline"
}: {
  entityType: QRShareDialogProps['entityType']
  entityId: string
  entityTitle: string
  entityTitleAr?: string
  siteId?: string
  metadata?: Record<string, any>
  size?: "sm" | "md" | "lg"
  variant?: "outline" | "ghost" | "secondary"
}) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => console.log('QR sharing temporarily disabled')}
      className="gap-1"
    >
      <QrCode className="h-4 w-4" />
      Share
    </Button>
  )
}
