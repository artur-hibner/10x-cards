import React from "react";

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  errorMessage?: string;
}

const TextInputArea: React.FC<TextInputAreaProps> = ({
  value,
  onChange,
  onBlur,
  errorMessage,
}) => {
  const charCount = value.length;
  const minChars = 1000;
  const maxChars = 10000;
  const isValid = charCount >= minChars && charCount <= maxChars;

  return (
    <div className="w-full space-y-2">
      <label htmlFor="source-text" className="block text-sm font-medium">
        Wprowadź tekst źródłowy (min. 1000, max. 10000 znaków)
      </label>
      <div className="relative">
        <textarea
          id="source-text"
          className={`w-full min-h-[200px] p-3 border rounded-md ${
            errorMessage ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-primary"
          } focus:ring-2 focus:outline-none`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="Wklej tutaj tekst, z którego chcesz wygenerować fiszki..."
          aria-describedby="text-error text-counter"
          aria-invalid={errorMessage ? "true" : "false"}
        />
        <div id="text-counter" className={`text-sm mt-1 text-right ${isValid ? "text-gray-500" : "text-red-500"}`}>
          {charCount} / {maxChars} znaków
        </div>
        {errorMessage && (
          <p id="text-error" className="text-sm text-red-500 mt-1">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default TextInputArea; 