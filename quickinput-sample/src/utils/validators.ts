export interface ValidationResult {
	isValid: boolean;
	errorMessage?: string;
}

export type ValidationFunction = (input: string, errorMessage?: string) => ValidationResult;

export const defaultValidateFct: ValidationFunction = () => {
	return {
		isValid: true,
		errorMessage: 'defaultValidateFct is always true',
	};
};

export const validateNotEmpty: ValidationFunction = (
	input,
	errorMessage = 'This field cannot be empty',
) => {
	if (input.trim().length === 0) {
		return {
			isValid: false,
			errorMessage: errorMessage,
		};
	}
	return {
		isValid: true,
	};
};

export const validateDotSeparatedName: ValidationFunction = (
	input,
	errorMessage = 'Invalid namespace. Must be dot separated, only containa-z, A-Z, 0-9 and _',
) => {
	const pattern = /^\w+(\.\w+)*(-\w+)*$/;
	if (pattern.test(input)) {
		return {
			isValid: true,
		};
	}
	return {
		isValid: false,
		errorMessage: errorMessage,
	};
};
