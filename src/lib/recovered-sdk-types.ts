/** Type bridge for SDK modules recovered from the legacy bundle. */
export interface RecoveredRuntimeContext {
  [runtimeProperty: string]: any
}

export type RecoveredMethods<T extends object> = Omit<T, 'constructor'>

export function defineRecoveredMethods<T extends object>(
  methods: T & ThisType<RecoveredRuntimeContext>
): T {
  return methods
}
