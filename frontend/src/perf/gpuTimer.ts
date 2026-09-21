import { perf } from './perf'

interface TimerExtension {
  TIME_ELAPSED_EXT: number
  GPU_DISJOINT_EXT: number
}

export interface GpuTimer {
  begin: () => void
  end: () => void
}

const MAX_PENDING = 8
const IDLE: GpuTimer = { begin: () => undefined, end: () => undefined }

function liveTimer(context: WebGL2RenderingContext, extension: TimerExtension): GpuTimer {
  const pending: WebGLQuery[] = []
  let open = false

  const collect = () => {
    const query = pending[0]
    if (!query || !context.getQueryParameter(query, context.QUERY_RESULT_AVAILABLE)) {
      return
    }
    const ms = Number(context.getQueryParameter(query, context.QUERY_RESULT)) / 1e6
    const disjoint = Boolean(context.getParameter(extension.GPU_DISJOINT_EXT))
    pending.shift()
    context.deleteQuery(query)
    perf.count('gpu.ms', disjoint ? 0 : ms)
    perf.gauge('gpu.ms', disjoint ? 0 : ms)
  }

  return {
    begin: () => {
      const query = pending.length < MAX_PENDING ? context.createQuery() : null
      if (!query) {
        return
      }
      context.beginQuery(extension.TIME_ELAPSED_EXT, query)
      pending.push(query)
      open = true
    },
    end: () => {
      if (open) {
        context.endQuery(extension.TIME_ELAPSED_EXT)
      }
      open = false
      collect()
    },
  }
}

export function gpuTimer(context: WebGL2RenderingContext): GpuTimer {
  const extension = context.getExtension('EXT_disjoint_timer_query_webgl2') as TimerExtension | null
  return extension ? liveTimer(context, extension) : IDLE
}
