# AI Frame Generator API - Dokumentasi

## 📋 Overview

API untuk generate frame photo booth menggunakan AI. API ini terdiri dari 3 endpoint utama:

1. **`/api/ai/chat`** - Chat dengan AI untuk mendapatkan bantuan desain frame
2. **`/api/ai/generate-frame`** - Generate frame template sebagai SVG
3. **`/api/ai/generate-image`** - Generate image dari text prompt (bonus)

---

## 🎯 Endpoint 1: AI Chat

**Endpoint:** `POST /api/ai/chat`

**Deskripsi:** Chat dengan AI assistant untuk mendapatkan bantuan dalam mendesain frame. AI akan bertanya tentang preferensi user dan menghasilkan `frameSpec` ketika user sudah confirm design.

### Request Body

```typescript
{
  "messages": [
    {
      "role": "user" | "assistant",
      "content": "string"
    }
  ]
}
```

### Response

```typescript
{
  "message": "string",           // Response dari AI
  "frameSpec": {                 // Optional, hanya ada jika user sudah confirm
    "frameCount": number,        // 2-6
    "layout": "vertical" | "horizontal" | "grid",
    "backgroundColor": "#RRGGBB",
    "borderColor": "#RRGGBB",
    "gradientFrom": "#RRGGBB",   // Optional
    "gradientTo": "#RRGGBB"      // Optional
  },
  "error": "string"              // Optional, jika ada error
}
```

### Contoh Penggunaan

```typescript
import { aiAPI } from '@/services/api';

// Kirim pesan ke AI
const response = await aiAPI.chatAI([
  { role: 'user', content: 'Saya ingin frame dengan 3 foto vertikal, warna biru' }
]);

console.log(response.message);
// "Bagus! Frame 3 foto vertikal dengan warna biru akan terlihat elegan. 
//  Apakah Anda ingin gradient atau warna solid?"

// Lanjut chat
const response2 = await aiAPI.chatAI([
  { role: 'user', content: 'Saya ingin frame dengan 3 foto vertikal, warna biru' },
  { role: 'assistant', content: response.message },
  { role: 'user', content: 'Gradient dari biru muda ke biru tua' }
]);

// Jika user confirm, frameSpec akan ada
if (response2.frameSpec) {
  console.log('Frame spec siap:', response2.frameSpec);
  // Lanjut ke generate frame
}
```

---

## 🖼️ Endpoint 2: Generate Frame

**Endpoint:** `POST /api/ai/generate-frame`

**Deskripsi:** Generate frame template sebagai SVG image berdasarkan spesifikasi yang diberikan.

### Request Body

```typescript
{
  "frameCount": number,          // Required: 2-6
  "layout": "vertical" | "horizontal" | "grid",  // Required
  "backgroundColor": "#RRGGBB",  // Required: hex color
  "borderColor": "#RRGGBB",      // Required: hex color
  "borderThickness": number,     // Optional: 1-10, default 2
  "borderRadius": number,        // Optional: 0-50, default 8
  "gradientFrom": "#RRGGBB",     // Optional: hex color
  "gradientTo": "#RRGGBB"        // Optional: hex color
}
```

### Response

```typescript
{
  "success": boolean,
  "image": "string",             // Base64 encoded SVG
  "contentType": "image/svg+xml",
  "error": "string",             // Optional, jika ada error
  "details": "string"            // Optional, detail error
}
```

### Contoh Penggunaan

#### **Cara 1: Menggunakan fungsi `generateFrame` (recommended)**

```typescript
import { aiAPI } from '@/services/api';
import type { GenerateFrameRequest } from '@/types/ai-frame.types';

// Buat request object
const request: GenerateFrameRequest = {
  frameCount: 3,
  layout: 'vertical',
  backgroundColor: '#FFD700',
  borderColor: '#FFA500',
  gradientFrom: '#FFD700',
  gradientTo: '#FFC700',
  borderThickness: 2,
  borderRadius: 8
};

// Generate frame
const response = await aiAPI.generateFrame(request);

if (response.success) {
  // Convert base64 ke data URL untuk display
  const imgSrc = `data:${response.contentType};base64,${response.image}`;
  
  // Gunakan di img tag
  document.querySelector('img').src = imgSrc;
}
```

#### **Cara 2: Menggunakan helper function `generateFrameSimple`**

```typescript
import { aiAPI } from '@/services/api';

// Lebih simple, parameter by parameter
const response = await aiAPI.generateFrameSimple(
  3,              // frameCount
  'vertical',     // layout
  '#FFD700',      // backgroundColor
  '#FFA500',      // borderColor
  '#FFD700',      // gradientFrom
  '#FFC700'       // gradientTo
);

if (response.success) {
  const imgSrc = `data:${response.contentType};base64,${response.image}`;
  // Use imgSrc
}
```

### Validasi

API akan memvalidasi request sebelum generate frame:

- **frameCount**: Harus antara 2-6
- **layout**: Harus salah satu dari `vertical`, `horizontal`, `grid`
- **backgroundColor**: Harus hex color valid (e.g., `#FF5733`)
- **borderColor**: Harus hex color valid
- **borderThickness**: Jika ada, harus antara 1-10
- **borderRadius**: Jika ada, harus antara 0-50

Jika validasi gagal, akan return response dengan `success: false` dan `details` berisi error message.

---

## 🎨 Endpoint 3: Generate Image (Bonus)

**Endpoint:** `POST /api/ai/generate-image`

**Deskripsi:** Generate image dari text prompt menggunakan AI image generator.

### Request Body

```typescript
{
  "prompt": "string",            // Required: text prompt
  "negative_prompt": "string",   // Optional
  "num_inference_steps": number  // Optional: default 10
}
```

### Response

```typescript
{
  "success": boolean,
  "image": "string",             // Base64 encoded image
  "contentType": "string",       // MIME type
  "error": "string",             // Optional
  "details": "string"            // Optional
}
```

### Contoh Penggunaan

```typescript
import { aiAPI } from '@/services/api';

const response = await aiAPI.generateImage(
  'Beautiful sunset over mountains, photorealistic',
  'ugly, blurry, low quality'
);

if (response.success) {
  const imgSrc = `data:${response.contentType};base64,${response.image}`;
  // Display image
}
```

---

## 🔄 Flow Lengkap: Chat → Generate Frame

Berikut adalah flow lengkap dari chat dengan AI sampai generate frame:

```typescript
import { aiAPI } from '@/services/api';
import type { ChatMessage } from '@/types/ai-frame.types';

// Step 1: Inisialisasi chat history
const chatHistory: ChatMessage[] = [
  { 
    role: 'user', 
    content: 'Saya ingin frame dengan 3 foto vertikal, warna biru gradient' 
  }
];

// Step 2: Chat dengan AI
let response = await aiAPI.chatAI(chatHistory);
console.log('AI:', response.message);

// Add AI response ke history
chatHistory.push({
  role: 'assistant',
  content: response.message
});

// Step 3: User confirm
chatHistory.push({
  role: 'user',
  content: 'Ya, saya setuju dengan design itu'
});

// Step 4: Chat lagi untuk dapat frameSpec
response = await aiAPI.chatAI(chatHistory);

// Step 5: Jika frameSpec ada, generate frame
if (response.frameSpec) {
  console.log('Frame spec:', response.frameSpec);
  
  const frameResponse = await aiAPI.generateFrame({
    ...response.frameSpec,
    borderThickness: 2,
    borderRadius: 8
  });
  
  if (frameResponse.success) {
    const imgSrc = `data:${frameResponse.contentType};base64,${frameResponse.image}`;
    
    // Display frame
    const img = document.createElement('img');
    img.src = imgSrc;
    document.body.appendChild(img);
    
    console.log('Frame berhasil di-generate!');
  }
}
```

---

## 🧪 Cara Mencoba API

### **1. Menggunakan Frontend yang sudah ada**

Aplikasi sudah memiliki halaman `AITemplateCreator.tsx` yang bisa digunakan untuk mencoba API:

1. Jalankan backend:
   ```bash
   cd backend-pixelPlayground
   npm run dev
   ```

2. Jalankan frontend:
   ```bash
   cd frontend-pixelPlayground
   npm run dev
   ```

3. Buka browser dan akses halaman AI Template Creator

### **2. Menggunakan PowerShell**

Buat file `test-ai-frame.ps1`:

```powershell
# Test AI Chat
$chatBody = @{
    messages = @(
        @{
            role = "user"
            content = "Saya ingin frame 3 foto vertikal dengan gradient biru"
        }
    )
} | ConvertTo-Json -Depth 10

$chatResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/chat" `
    -Method POST `
    -ContentType "application/json" `
    -Body $chatBody

Write-Host "AI Response:" $chatResponse.message
if ($chatResponse.frameSpec) {
    Write-Host "Frame Spec:" ($chatResponse.frameSpec | ConvertTo-Json)
}

# Test Generate Frame
$frameBody = @{
    frameCount = 3
    layout = "vertical"
    backgroundColor = "#4A90E2"
    borderColor = "#2E5C8A"
    gradientFrom = "#4A90E2"
    gradientTo = "#2E5C8A"
    borderThickness = 2
    borderRadius = 8
} | ConvertTo-Json

$frameResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/ai/generate-frame" `
    -Method POST `
    -ContentType "application/json" `
    -Body $frameBody

Write-Host "Frame Generated:" $frameResponse.success
Write-Host "Content Type:" $frameResponse.contentType
Write-Host "Image Length:" $frameResponse.image.Length

# Save image ke file
$svgContent = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($frameResponse.image))
$svgContent | Out-File -FilePath "generated-frame.svg" -Encoding UTF8
Write-Host "Frame saved to generated-frame.svg"
```

Jalankan:
```bash
.\test-ai-frame.ps1
```

### **3. Menggunakan HTML file**

Buat file `test-ai-frame.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test AI Frame Generator</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        button {
            background: #4A90E2;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
        }
        button:hover {
            background: #357ABD;
        }
        #result {
            margin-top: 20px;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 5px;
        }
        img {
            max-width: 100%;
            margin-top: 20px;
            border: 2px solid #ddd;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <h1>🤖 Test AI Frame Generator</h1>
    
    <div>
        <button onclick="testChat()">Test AI Chat</button>
        <button onclick="testGenerateFrame()">Test Generate Frame</button>
    </div>

    <div id="result"></div>

    <script>
        const API_URL = 'http://localhost:3001/api';

        async function testChat() {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<p>Loading...</p>';

            try {
                const response = await fetch(`${API_URL}/ai/chat`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        messages: [
                            {
                                role: 'user',
                                content: 'Saya ingin frame dengan 3 foto vertikal, warna biru gradient'
                            }
                        ]
                    })
                });

                const data = await response.json();
                
                resultDiv.innerHTML = `
                    <h3>AI Response:</h3>
                    <p>${data.message}</p>
                    ${data.frameSpec ? `
                        <h3>Frame Spec:</h3>
                        <pre>${JSON.stringify(data.frameSpec, null, 2)}</pre>
                    ` : ''}
                `;
            } catch (error) {
                resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            }
        }

        async function testGenerateFrame() {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '<p>Generating frame...</p>';

            try {
                const response = await fetch(`${API_URL}/ai/generate-frame`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        frameCount: 3,
                        layout: 'vertical',
                        backgroundColor: '#4A90E2',
                        borderColor: '#2E5C8A',
                        gradientFrom: '#4A90E2',
                        gradientTo: '#2E5C8A',
                        borderThickness: 2,
                        borderRadius: 8
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    const imgSrc = `data:${data.contentType};base64,${data.image}`;
                    
                    resultDiv.innerHTML = `
                        <h3>✅ Frame berhasil di-generate!</h3>
                        <p>Content Type: ${data.contentType}</p>
                        <img src="${imgSrc}" alt="Generated Frame" />
                    `;
                } else {
                    resultDiv.innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            }
        }
    </script>
</body>
</html>
```

Buka file HTML ini di browser (pastikan backend sudah running).

---

## 📝 TypeScript Types

Semua types sudah didefinisikan di:
- **Backend:** `src/types/ai-frame.types.ts`
- **Frontend:** `src/types/ai-frame.types.ts`

Import types yang dibutuhkan:

```typescript
import type {
  GenerateFrameRequest,
  GenerateFrameResponse,
  ChatMessage,
  ChatAIRequest,
  ChatAIResponse,
  AIFrameSpecification,
  FrameLayout,
  FRAME_CONSTRAINTS
} from '@/types/ai-frame.types';
```

---

## ⚠️ Error Handling

API akan return error dengan format:

```typescript
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information"
}
```

Contoh error handling:

```typescript
try {
  const response = await aiAPI.generateFrame(request);
  
  if (!response.success) {
    console.error('Error:', response.error);
    console.error('Details:', response.details);
    // Handle error
  } else {
    // Success
  }
} catch (error) {
  console.error('Network error:', error);
  // Handle network error
}
```

---

## 🎓 Tips & Best Practices

1. **Gunakan TypeScript types** untuk type safety
2. **Validate input** sebelum kirim ke API menggunakan `validateFrameRequest()` (backend)
3. **Handle errors** dengan baik di frontend
4. **Cache chat history** untuk maintain conversation context
5. **Optimize performance**: Generate frame hanya setelah user confirm
6. **Use semantic colors**: Gunakan hex colors yang sesuai dengan theme aplikasi

---

## 🚀 Quick Start

```typescript
import { aiAPI } from '@/services/api';

// Simple example: Generate frame langsung
const response = await aiAPI.generateFrameSimple(
  3,           // 3 photos
  'vertical',  // vertical layout
  '#FFD700',   // gold background
  '#FFA500'    // orange border
);

if (response.success) {
  const imgSrc = `data:${response.contentType};base64,${response.image}`;
  // Display image
  console.log('Frame generated:', imgSrc);
}
```

Selamat mencoba! 🎉
