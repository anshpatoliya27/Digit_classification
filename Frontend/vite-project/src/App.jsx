import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Bot, User, Send, Image as ImageIcon, Loader2, X, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'ai',
      text: 'Hello! I am your AI Digit Recognizer. Upload an image of a handwritten digit from 0 to 9, and I will classify it for you instantly.',
    },
  ]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedFile]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      e.target.value = ''; // Reset input
    }
  };

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleSend = async () => {
    if (!selectedFile) return;

    const fileToSend = selectedFile;
    const currentPreviewUrl = previewUrl;

    // Reset input states
    setSelectedFile(null);
    setPreviewUrl(null);

    // Add User Message
    const userMessageId = Date.now();
    setMessages((prev) => [
      ...prev,
      { id: userMessageId, role: 'user', image: currentPreviewUrl },
    ]);

    // Add Loading AI Message
    const aiMessageId = Date.now() + 1;
    setMessages((prev) => [
      ...prev,
      { id: aiMessageId, role: 'ai', isLoading: true },
    ]);

    // Make API Call
    try {
      const formData = new FormData();
      formData.append('file', fileToSend); // Modify the key 'file' based on what your backend expects

      const response = await axios.post('http://127.0.0.1:5000/predict', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { prediction, confidence } = response.data;
      const confPercentage = (confidence * 100).toFixed(2);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, isLoading: false, prediction, confidence: confPercentage }
            : msg
        )
      );
    } catch (error) {
      console.error(error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, isLoading: false, text: 'Sorry, there was an error processing your image. Please make sure the backend is running and try again.', isError: true }
            : msg
        )
      );
    }
  };

  // UI rendering based on chat layout
  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-indigo-500/30">

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-zinc-100 tracking-tight">Digit AI</h1>
            <p className="text-xs text-zinc-400 font-medium">Vision Model based on FLASK backend</p>
          </div>
        </div>
        <button
          onClick={() => setMessages([{ id: Date.now(), role: 'ai', text: 'Hello! I am your AI Digit Recognizer. Upload an image of a handwritten digit from 0 to 9, and I will classify it for you instantly.' }])}
          className="p-2 px-3 text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium border border-zinc-700"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto w-full flex flex-col items-center">
        {messages.length === 1 && (
          <div className="mt-24 sm:mt-32 flex flex-col items-center text-center max-w-lg px-6">
            <div className="w-20 h-20 mb-6 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 ring-1 ring-indigo-500/20 shadow-2xl shadow-indigo-500/10 hover:scale-105 transition-transform">
              <Bot className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent mb-4">
              AI Digit Recognizer
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Upload any handwritten digit, and I will confidently identify it using my neural network.
            </p>
          </div>
        )}

        <div className="w-full max-w-3xl flex flex-col pb-6 mt-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-4 px-6 py-6 sm:px-8 ${msg.role === 'ai' && messages.length > 1 ? 'bg-zinc-900/40 border-y border-zinc-800/50' : ''}`}
              >
                {/* Avatar */}
                <div className="shrink-0 flex items-start">
                  {msg.role === 'ai' ? (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center ring-2 ring-indigo-500/20 shadow-sm shadow-indigo-500/50 mt-1">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center mt-1">
                      <User className="w-5 h-5 text-zinc-200" />
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0 pt-1">
                  {msg.role === 'user' && msg.image && (
                    <div className="rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900/50 inline-block shadow-lg">
                      <img src={msg.image} alt="Uploaded digit" className="max-w-[240px] max-h-[240px] object-contain p-2" />
                    </div>
                  )}

                  {msg.role === 'ai' && (
                    <div className="max-w-none text-zinc-300">
                      {msg.isLoading ? (
                        <div className="flex items-center gap-3 text-zinc-400 h-8">
                          <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                          <span className="font-medium animate-pulse text-sm">Analyzing image features...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          {msg.isError ? (
                            <div className="text-rose-400 bg-rose-500/10 p-4 rounded-lg border border-rose-500/20 text-sm">
                              {msg.text}
                            </div>
                          ) : (
                            <div>
                              {msg.prediction !== undefined ? (
                                <div>
                                  <p className="mb-4 text-base leading-relaxed">
                                    I have analyzed the provided image. Here is the predicted result:
                                  </p>
                                  <div className="mb-2 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700/50 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-black/20">
                                    <div className="flex flex-col items-center">
                                      <div className="text-7xl font-black bg-gradient-to-t from-indigo-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm leading-none">
                                        {msg.prediction}
                                      </div>
                                    </div>
                                    <div className="flex-1 flex flex-col w-full text-center md:text-left">
                                      <div className="text-xs text-zinc-400 font-semibold uppercase tracking-widest mb-1.5 flex items-center justify-center md:justify-start gap-2">
                                        Confidence Score
                                      </div>
                                      <div className="text-zinc-300 text-sm mb-3">
                                        The model is <span className="font-bold text-white">{msg.confidence}%</span> confident in this classification.
                                      </div>
                                      <div className="w-full bg-zinc-950/50 rounded-full h-2 overflow-hidden border border-zinc-800/80">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{ width: `${msg.confidence}%` }}
                                          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
                                          className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-2 rounded-full"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-base leading-relaxed">{msg.text}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-4 sm:p-6 bg-zinc-950 sticky bottom-0 z-10 w-full flex flex-col items-center border-t border-zinc-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="w-full max-w-3xl relative">

          {/* Faux Text Input Area */}
          <div className="relative group rounded-2xl bg-zinc-800/50 border border-zinc-700 hover:border-zinc-500 transition-colors focus-within:border-indigo-500 focus-within:bg-zinc-800/80 flex items-end sm:items-center shadow-lg pt-1 pb-1 px-1">

            {/* Image Preview inside input area */}
            <AnimatePresence>
              {previewUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, width: 0, marginRight: 0 }}
                  className="relative ml-2 mr-2 my-1 shrink-0"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-700/50 group-hover:border-zinc-600 transition-colors relative isolate">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover p-1 rounded-xl" />
                    <button
                      onClick={removeFile}
                      className="absolute -top-1 -right-1 bg-zinc-800 text-zinc-300 hover:text-white hover:bg-rose-500 rounded-full p-0.5 shadow-lg transition-colors border border-zinc-700 z-10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Upload Button */}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            {!previewUrl && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 m-1 text-zinc-400 hover:text-indigo-400 hover:bg-zinc-700/50 rounded-xl transition-all h-12 w-12 flex items-center justify-center shrink-0"
                title="Upload image"
              >
                <ImageIcon className="w-6 h-6" />
              </button>
            )}

            <div className="flex-1 py-3 px-3 min-h-[56px] flex items-center cursor-text" onClick={() => !selectedFile && fileInputRef.current?.click()}>
              <span className="text-zinc-500 select-none text-base font-medium">
                {selectedFile ? 'Ready to analyze...' : 'Upload an image of a digit...'}
              </span>
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={!selectedFile}
              className={`p-3 m-1 rounded-xl transition-all h-12 w-12 flex items-center justify-center shrink-0 ${selectedFile
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/25'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed hidden sm:flex'
                }`}
            >
              <Send className={`w-5 h-5 ${selectedFile ? 'ml-1' : ''}`} />
            </button>
          </div>
          <div className="mt-3 text-center text-[11px] text-zinc-500 px-4">
            Digit AI can make mistakes. Ensure images are clear and strictly digits for the best prediction accuracy.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
