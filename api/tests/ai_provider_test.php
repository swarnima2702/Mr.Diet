<?php
putenv('OPENAI_API_KEY=test-openai-key');
putenv('GEMINI_API_KEY=test-gemini-key');
putenv('OPENAI_BASE_URL=http://127.0.0.1:8011/v1');
putenv('GEMINI_BASE_URL=http://127.0.0.1:8011/v1beta');

require_once __DIR__ . '/../services/openai_service.php';

function assertProviderResult($actual, $provider)
{
    if (($actual['provider'] ?? null) !== $provider) {
        throw new RuntimeException("Expected provider {$provider}: " . json_encode($actual));
    }
    if (($actual['system_instruction'] ?? null) !== true || ($actual['json_mode'] ?? null) !== true) {
        throw new RuntimeException("{$provider} payload did not enable system instructions and JSON mode");
    }
}

putenv('AI_PROVIDER=openai');
assertProviderResult(requestAIJson('System prompt', 'User prompt', 0.2, 5), 'openai');

putenv('AI_PROVIDER=gemini');
assertProviderResult(requestAIJson('System prompt', 'User prompt', 0.2, 5), 'gemini');

echo "AI provider adapter tests passed\n";
