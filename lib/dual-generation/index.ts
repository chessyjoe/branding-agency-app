// Export dual generation functionality
export * from './service'
export * from './universal-service'
export * from './integration-utils'

// Main exports from correct files
export { 
  DualGenerationService, 
  createDualGenerationService
} from './service'

export {
  UniversalDualGenerationService,
  createUniversalDualService
} from './universal-service'

export {
  DualGenerationIntegration,
  createDualIntegration,
  integrateDualGeneration,
  prepareDualGenerationData
} from './integration-utils'

// Type exports
export type { 
  DualGenerationRequest, 
  DualGenerationResult
} from './service'

export type {
  UniversalDualRequest,
  UniversalDualResult
} from './universal-service'
