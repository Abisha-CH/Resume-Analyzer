import { Badge } from "@/components/ui/badge"
import type { ResumeStatus } from "@/lib/types/resume"

interface ResumeStatusBadgeProps {
  status: ResumeStatus
}

export function ResumeStatusBadge({ status }: ResumeStatusBadgeProps) {
  switch (status) {
    case "pending":
      return <Badge variant="default">Pending</Badge>
    case "processing":
      return <Badge variant="default">Processing</Badge>
    case "parsed":
      return <Badge variant="primary">Ready to Analyze</Badge>
    case "analyzed":
      return <Badge variant="success">Analyzed</Badge>
    case "failed":
      return <Badge variant="outline">Failed</Badge>
    default: {
      // exhaustive check — TypeScript will error if a new status is added without handling it
      const _exhaustive: never = status
      return <Badge variant="default">{_exhaustive}</Badge>
    }
  }
}
