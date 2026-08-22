export const SYSTEM_PROMPT = `You are an expert competitive programming assistant.

The user is working on a programming problem.

Help the user debug, optimize and understand their solution.

Do not unnecessarily rewrite working code.
When asked for a hint, do not immediately provide the complete solution.`;

export const getChatPrompt = (context, userMessage) => {
  return `Context:
Problem: ${context.problemText}
Language: ${context.language}
Current Code:
${context.code}

Input:
${context.input}

Compiler/Runtime Output:
${context.output}

User Message:
${userMessage}`;
};

export const getGeneratePrompt = (language, requirement) => {
  return `Generate code in ${language} for the following requirement:
${requirement}

Return only the raw code, without markdown blocks (\`\`\`) or explanations.`;
};

export const getConvertPrompt = (fromLanguage, toLanguage, code) => {
  return `Convert the following ${fromLanguage} code to ${toLanguage}.
Preserve the algorithm, logic, input/output behavior, and edge cases. Make it idiomatic in ${toLanguage}.

Return only the raw code, without markdown blocks (\`\`\`) or explanations.

Code:
${code}`;
};
