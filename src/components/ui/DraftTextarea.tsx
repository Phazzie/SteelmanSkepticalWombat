import React, { useState } from 'react';

/**
 * A textarea component that saves drafts on blur and has an explicit submit button.
 * @param {object} props - Component props including value, onSave, onSubmit, placeholder, and disabled state.
 * @returns {JSX.Element}
 */
const DraftTextarea = React.forwardRef(({ value, onSave, onSubmit, placeholder, disabled, submitText = "Submit & Lock" }, ref) => {
    const [text, setText] = useState(value);

    const handleBlur = () => {
        if (!disabled && text !== value) {
            onSave(text);
        }
    };

    return (
        <div>
            <textarea
                ref={ref}
                className="w-full p-3 border-2 border-gray-700 rounded-lg bg-gray-800 text-gray-200 focus:ring-2 focus:ring-lime-400 focus:border-lime-400 transition disabled:bg-gray-700/50"
                rows="8"
                placeholder={placeholder}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleBlur}
                disabled={disabled}
            />
            {!disabled && (
                <button onClick={() => onSubmit(text)} className="mt-4 bg-lime-500 hover:bg-lime-600 text-gray-900 font-bold py-2 px-4 rounded-lg transition">
                    {submitText}
                </button>
            )}
        </div>
    );
});

export default DraftTextarea;
