<?php
header('Content-Type: application/json');

$uri = $_SERVER['REQUEST_URI'] ?? '';
$body = json_decode(file_get_contents('php://input'), true) ?: [];

if (str_contains($uri, ':generateContent')) {
    $hasSystemInstruction = isset($body['systemInstruction']['parts'][0]['text']);
    $hasJsonMode = ($body['generationConfig']['responseMimeType'] ?? '') === 'application/json';
    echo json_encode([
        'candidates' => [[
            'content' => [
                'parts' => [[
                    'text' => json_encode([
                        'provider' => 'gemini',
                        'system_instruction' => $hasSystemInstruction,
                        'json_mode' => $hasJsonMode,
                    ]),
                ]],
            ],
        ]],
    ]);
    exit;
}

$hasSystemMessage = ($body['messages'][0]['role'] ?? '') === 'system';
$hasJsonMode = ($body['response_format']['type'] ?? '') === 'json_object';
echo json_encode([
    'choices' => [[
        'message' => [
            'content' => json_encode([
                'provider' => 'openai',
                'system_instruction' => $hasSystemMessage,
                'json_mode' => $hasJsonMode,
            ]),
        ],
    ]],
]);
