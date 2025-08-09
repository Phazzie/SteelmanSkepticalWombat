import React from 'react';

interface DraftTextareaProps {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
    onSave: () => void; // The parent now handles what to save
    onSubmit: () => void; // The parent now handles what to submit
    placeholder?: string;
    disabled?: boolean;
    submitText?: string;
}

/**
 * A controlled textarea component that saves drafts on blur and has an explicit submit button.
 * The parent component is responsible for managing the state of the text.
 */
const DraftTextarea = React.forwardRef<HTMLTextAreaElement, DraftTextareaProps>(
    ({ value, onChange, onSave, onSubmit, placeholder, disabled, submitText = "Submit & Lock" }, ref) => {

        const handleBlur = () => {
            if (!disabled) {
                onSave();
            }
        };

        return (
            <div>
                <textarea
                    ref={ref}
                    className="w-full p-3 border-2 border-gray-700 rounded-lg bg-gray-800 text-gray-200 focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition disabled:bg-gray-700/50"
                    rows="8"
                    placeholder={placeholder}
                    value={value} // Directly use the value from props
                    onChange={onChange} // Pass the event up to the parent
                    onBlur={handleBlur}
                    disabled={disabled}
                />
                {!disabled && (
                    <button onClick={onSubmit} className="mt-4 bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition">
                        {submitText}
                    </button>
                )}
            </div>
        );
    }
);

export default DraftTextarea;
