/**
 * Clinical Profile Types
 * 
 * Extended patient clinical information including demographics,
 * ethnicity, family history, and phenotype data.
 */

export type Sex = 'male' | 'female' | 'other'

export type AgeGroup = 'neonatal' | 'infant' | 'child' | 'adult' | 'elderly'

export type Ethnicity = 
  | 'european'
  | 'ashkenazi_jewish'
  | 'east_asian'
  | 'south_asian'
  | 'african'
  | 'hispanic'
  | 'middle_eastern'
  | 'admixed'
  | 'other'

export type Indication =
  | 'proactive_screening'
  | 'family_history'
  | 'carrier_screening'
  | 'prenatal'
  | 'diagnostic_workup'
  | 'other'

export type SampleType = 'singleton' | 'duo' | 'trio' | 'quad'

export type DiseaseOnset = 'birth' | 'childhood' | 'adulthood' | 'unknown'

export type Severity = 'mild' | 'moderate' | 'severe' | 'unknown'

/**
 * Required demographics
 */
export interface Demographics {
  age_years?: number
  age_days?: number
  age_group?: AgeGroup
  sex: Sex
}

/**
 * Ethnicity information
 */
export interface EthnicityData {
  primary: Ethnicity
  populations?: string[]
  note?: string
}

/**
 * Family history information
 */
export interface FamilyHistory {
  has_affected_relatives: boolean
  consanguinity: boolean
  details?: string
}

/**
 * Clinical context
 */
export interface ClinicalContext {
  indication: Indication
  indication_details?: string
  family_history?: FamilyHistory
}

/**
 * Phenotype data (HPO terms)
 */
export interface PhenotypeData {
  hpo_terms: Array<{
    hpo_id: string
    name: string
    definition?: string
  }>
  clinical_synopsis?: string
  onset_age?: DiseaseOnset
  severity?: Severity
  clinical_notes?: string
}

/**
 * Reproductive context
 */
export interface ReproductiveContext {
  is_pregnant?: boolean
  gestational_age_weeks?: number
  family_planning?: boolean
}

/**
 * Sample information
 */
export interface SampleInfo {
  sample_type: SampleType
  has_parental_samples: boolean
  has_affected_sibling: boolean
}

/**
 * Previous testing
 */
export interface PreviousTest {
  test_type: string
  date?: string
  result?: string
  findings?: string
}

/**
 * Consent preferences
 */
export interface ConsentPreferences {
  secondary_findings: boolean
  carrier_results: boolean
  pharmacogenomics: boolean
}

/**
 * Complete Clinical Profile
 */
export interface ClinicalProfile {
  id?: string
  session_id: string
  
  // Required
  demographics: Demographics
  
  // Recommended
  ethnicity?: EthnicityData
  clinical_context?: ClinicalContext
  
  // Optional
  phenotype?: PhenotypeData
  reproductive?: ReproductiveContext
  sample_info?: SampleInfo
  previous_tests?: PreviousTest[]
  consent?: ConsentPreferences
  
  // Metadata
  created_at?: string
  updated_at?: string
}

/**
 * Request/Response for saving clinical profile
 */
export interface SaveClinicalProfileRequest {
  demographics: Demographics
  ethnicity?: EthnicityData
  clinical_context?: ClinicalContext
  phenotype?: PhenotypeData
  reproductive?: ReproductiveContext
  sample_info?: SampleInfo
  previous_tests?: PreviousTest[]
  consent?: ConsentPreferences
}

export interface SaveClinicalProfileResponse extends ClinicalProfile {
  message: string
}
