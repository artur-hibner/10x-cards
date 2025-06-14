export interface AIModel {
  id: string;
  name: string;
  modelPath: string;
  contextTokens: string;
  isDefault?: boolean;
}

export const AI_MODELS: AIModel[] = [
  {
    id: "deepseek-chat-v3",
    name: "Gemini 2.0 Flash",
    modelPath: "google/gemini-2.0-flash-001",
    contextTokens: "1,048,576",
    isDefault: true,
  },
  {
    id: "gemini-2-flash-exp",
    name: "Gemini 2.0 Flash Exp",
    modelPath: "google/gemini-2.0-flash-exp:free",
    contextTokens: "1,048,576",
  },
  {
    id: "llama-4-scout",
    name: "Llama 4 Scout",
    modelPath: "meta-llama/llama-4-scout:free",
    contextTokens: "200,000",
  },
];

// Funkcje pomocnicze
export const getDefaultModel = (): AIModel => {
  return AI_MODELS.find((model) => model.isDefault) || AI_MODELS[0];
};

export const getModelById = (id: string): AIModel | undefined => {
  return AI_MODELS.find((model) => model.id === id);
};

export const getModelByPath = (modelPath: string): AIModel | undefined => {
  return AI_MODELS.find((model) => model.modelPath === modelPath);
};
