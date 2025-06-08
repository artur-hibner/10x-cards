import type { Database } from "./db/database.types";

export type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];
export type FlashcardInsert = Database["public"]["Tables"]["flashcards"]["Insert"];
export type GenerationEntity = Database["public"]["Tables"]["generations"]["Row"];
export type GenerationErrorLogEntity = Database["public"]["Tables"]["generation_error_logs"]["Row"];

// Wspólne typy używane w wielu DTO
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
}

// Źródło fiszki
export type FlashcardSource = "ai-full" | "ai-edited" | "manual";

// Status edycji zaakceptowanej propozycji
export type EditStatus = "edited" | "unedited";

// ---- FLASHCARDS DTO ----

export type FlashcardDTO = Pick<
  Flashcard,
  "id" | "front" | "back" | "source" | "generation_id" | "created_at" | "updated_at"
>;

export interface FlashcardListResponseDTO {
  flashcards: FlashcardDTO[];
  pagination: PaginationInfo;
}

export interface CreateFlashcardDTO {
  front: string;
  back: string;
  source: FlashcardSource;
  generation_id: number | null;
}

export interface CreateFlashcardsRequestDTO {
  flashcards: CreateFlashcardDTO[];
}

export interface CreateFlashcardsResponseDTO {
  flashcards: FlashcardDTO[];
}

export type UpdateFlashcardDTO = Partial<Pick<Flashcard, "front" | "back" | "source" | "generation_id">>;

// ---- GENERATIONS DTO ----

export interface FlashcardProposalDTO {
  id: string;
  front: string;
  back: string;
}

export type GenerationStatus = "processing" | "completed" | "error";

export type GenerationDTO = Pick<
  GenerationEntity,
  | "model"
  | "generated_count"
  | "accepted_unedited_count"
  | "accepted_edited_count"
  | "source_text_hash"
  | "source_text_length"
  | "generation_duration"
  | "created_at"
  | "updated_at"
  | "source_text"
> & {
  generation_id: number;
  status: GenerationStatus;
  flashcards_proposals: FlashcardProposalDTO[];
};

export interface GenerationListResponseDTO {
  generations: Omit<GenerationDTO, "flashcards_proposals">[];
  total: number;
  page: number;
  per_page: number;
}

export interface CreateGenerationRequestDTO {
  source_text: string;
  model_id?: string; // ID agenta AI z konfiguracji
}

export interface CreateGenerationResponseDTO {
  generation_id: number;
  flashcards_proposals: FlashcardProposalDTO[];
  generated_count: number;
}

export interface AcceptFlashcardDTO {
  proposal_id: string;
  front: string;
  back: string;
  edit_status: EditStatus;
}

export interface AcceptFlashcardsRequestDTO {
  accepted_flashcards: AcceptFlashcardDTO[];
}

export interface AcceptFlashcardsResponseDTO {
  generation_id: number;
  accepted_count: number;
  accepted_flashcards: FlashcardDTO[];
  accepted_unedited_count: number;
  accepted_edited_count: number;
}

// ---- ERROR LOGS DTO ----

export interface ModelInputData {
  prompt: string;
  parameters: {
    temperature: number;
    max_tokens: number;
    [key: string]: number | string;
  };
}

export type GenerationErrorLogDTO = Omit<GenerationErrorLogEntity, "error_code"> & {
  id: string; // Zmiana typu z number na string zgodnie z API
  generation_id: number;
  timestamp: string;
  error_type: string;
  error_message: string;
  input_data: ModelInputData;
  stack_trace: string;
};

export interface GenerationErrorLogsResponseDTO {
  total: number;
  logs: GenerationErrorLogDTO[];
}

// ---- STATISTICS DTO ----

export interface ModelUsageStats {
  model: string;
  count: number;
  average_duration: number;
}

export interface GenerationStatisticsDTO {
  total_generations: number;
  total_generated_flashcards: number;
  total_accepted_flashcards: number;
  acceptance_rate: number;
  total_unedited_accepted: number;
  total_edited_accepted: number;
  edit_rate: number;
  models_used: ModelUsageStats[];
}

// ---- AUTH DTO ----

export interface UserAuthDTO {
  email: string;
  password: string;
}

export interface UserRegisterDTO extends UserAuthDTO {
  password_confirmation: string;
  gender: "male" | "female";
}

export interface RequestPasswordResetDTO {
  email: string;
}

export interface UpdatePasswordDTO {
  password: string;
  password_confirmation: string;
  token: string;
}

export interface AuthResponseDTO {
  success: boolean;
  message?: string;
  redirect?: string;
  details?: Record<string, string[]>;
  originalError?: string;
  type?: string;
}

export interface UserDTO {
  id: string;
  email: string;
}
