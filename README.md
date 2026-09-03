# SmartWay AI Study Companion

🚀 **Transform your documents into comprehensive study materials instantly!**

An intelligent study companion powered by Google's Gemini AI that automatically generates summaries, flashcards, and quizzes from your uploaded documents or text notes.

## ✨ Features

### 📄 **Multi-Format Document Support**
- **PDF Documents** (.pdf) - Full text extraction with advanced parsing
- **Word Documents** (.docx, .doc) - Complete text extraction from modern and legacy formats
- **Text Files** (.txt) - Direct text processing
- **Large File Support** - Handle documents up to **50MB**

### 🧠 **AI-Powered Study Materials**
- **Smart Summaries** - Key points, definitions, and concept overviews
- **Interactive Flashcards** - Dynamic question-answer cards with flip animations
- **Adaptive Quizzes** - Multiple-choice questions with explanations
- **Content Optimization** - Intelligent processing for very large documents

### 🔒 **Secure File Handling**
- **Supabase Integration** - Secure cloud storage for document uploads
- **Privacy-First** - Files processed securely with automatic cleanup
- **Real-time Processing** - Instant feedback and progress tracking

### 🎯 **Enhanced User Experience**
- **Drag & Drop Upload** - Intuitive file upload interface
- **Progress Tracking** - Real-time upload and processing status
- **Error Handling** - Clear, actionable error messages
- **Responsive Design** - Works perfectly on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Supabase account and project
- Google Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jayjovaun/smartway.git
   cd smartway
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the application**
   ```bash
   # Development mode (frontend + backend)
   npm run dev:full
   
   # Or separately:
   npm run dev:server  # Backend only
   npm run dev         # Frontend only
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

## 📚 Usage

### Document Upload
1. **Choose Input Method**: Select "Upload Document" tab
2. **Upload File**: Drag & drop or browse for your document
3. **Supported Formats**: PDF, Word (.docx, .doc), Text (.txt)
4. **File Size**: Up to 50MB supported
5. **Processing**: Automatic text extraction and AI analysis

### Text Input
1. **Choose Input Method**: Select "Type Text" tab
2. **Paste Content**: Add your study material (minimum 20 characters)
3. **Large Content**: Supports up to 200,000 characters
4. **Processing**: Direct AI analysis of your text

### Study Materials
- **Summary**: Overview, key points, definitions, important concepts
- **Flashcards**: Interactive cards with question/answer format
- **Quiz**: Multiple-choice questions with immediate feedback

## 🛠 Technical Features

### Document Processing
- **PDF Parsing**: Advanced text extraction using `pdf-parse`
- **Word Processing**: Modern .docx and legacy .doc support via `mammoth`
- **Error Handling**: Graceful handling of corrupted, encrypted, or image-based documents
- **Content Validation**: Automatic quality checks and optimization

### AI Processing
- **Google Gemini**: Latest Gemini-1.5-flash model for high-quality generation
- **Smart Chunking**: Automatic content optimization for large documents
- **Timeout Handling**: 2-minute processing window for complex content
- **Response Validation**: Comprehensive output verification

### Performance
- **Large Files**: 50MB document support with optimized processing
- **Concurrent Handling**: Multiple simultaneous requests supported
- **Memory Management**: Efficient buffer handling for large documents
- **Error Recovery**: Robust retry mechanisms and fallback options

## 🔧 API Endpoints

### Health Check
```bash
GET /api/health
```

### Generate Study Pack
```bash
POST /api/generate
Content-Type: application/json

# Text input
{
  "notes": "Your study material text here..."
}

# File URL input (from Supabase)
{
  "fileURL": "https://your-supabase-storage-url/filename.pdf"
}
```

## 📁 Project Structure

```
smartway/
├── src/
│   ├── components/          # React components
│   │   ├── FileDropUpload.tsx   # File upload interface
│   │   ├── InputForm.tsx        # Main input form
│   │   └── ...
│   ├── pages/              # Application pages
│   │   ├── AppPage.tsx         # Main application
│   │   ├── SummaryPage.tsx     # Study summary
│   │   ├── FlashcardsPage.tsx  # Interactive flashcards
│   │   └── QuizPage.tsx        # Quiz interface
│   ├── utils/              # Utility functions
│   │   ├── uploadFile.ts       # Supabase file upload
│   │   └── prompts.ts          # AI prompt templates
│   └── lib/
│       └── supabase.ts         # Supabase configuration
├── server.js               # Express server with document processing
├── package.json           # Dependencies and scripts
└── .env.example           # Environment template
```

## 🌐 Deployment

### Vercel Deployment
```bash
npm run build
npm run deploy:vercel
```

### Environment Variables for Production
```env
NODE_ENV=production
GEMINI_API_KEY=your_production_gemini_key
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_key
```

## 📄 Supported File Types

| Format | Extension | Support Level | Max Size |
|--------|-----------|---------------|----------|
| PDF | `.pdf` | ✅ Full support | 50MB |
| Word (Modern) | `.docx` | ✅ Full support | 50MB |
| Word (Legacy) | `.doc` | ⚠️ Limited support | 50MB |
| Text | `.txt` | ✅ Full support | 50MB |

## 🔍 Troubleshooting

### Common Issues

**Document Processing Errors:**
- Ensure document is not password-protected
- Check file is not corrupted or image-based
- Verify file size is under 50MB

**Upload Failures:**
- Check Supabase configuration
- Verify network connectivity
- Ensure file type is supported

**AI Generation Issues:**
- Verify Gemini API key is valid
- Check content length (minimum 20 characters)
- Ensure stable internet connection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📜 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** - Advanced natural language processing
- **Supabase** - Secure file storage and database
- **React** - Frontend framework
- **Mammoth.js** - Word document processing
- **pdf-parse** - PDF text extraction

---

**Made with ❤️ by the SmartWay Team**

Transform your learning experience with AI-powered study materials!
