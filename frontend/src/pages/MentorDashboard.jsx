import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { initiateSocketConnection, disconnectSocket, getSocket } from '../socket';
import api from '../api';
import { 
  FileText, Video, Trash, Plus, Upload, BookOpen, MessageSquare, Send, CheckCircle, HelpCircle, User, LogOut, Award, Menu
} from 'lucide-react';

const MentorDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('files'); // 'files' | 'tests' | 'messages'

  // Files tab states
  const [files, setFiles] = useState([]);
  const [fileTitle, setFileTitle] = useState('');
  const [fileDesc, setFileDesc] = useState('');
  const [fileObject, setFileObject] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Mock Tests states
  const [tests, setTests] = useState([]);
  const [scores, setScores] = useState([]);
  const [showTestModal, setShowTestModal] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestDesc, setNewTestDesc] = useState('');
  const [newQuestions, setNewQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }
  ]);

  // Chat/Messages states
  const [partners, setPartners] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null);

  // General notifier feedback
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    // Load base dashboard data
    fetchMyFiles();
    fetchMyTests();
    fetchStudentScores();
    fetchChatPartners();
    
    // Connect Socket IO for Messenger
    const token = localStorage.getItem('token');
    const socket = initiateSocketConnection(token);

    socket.on('receive_message', (message) => {
      // Append if message is from the active conversation partner
      if (activePartner && (message.sender._id === activePartner._id || message.receiver._id === activePartner._id)) {
        setMessages((prev) => [...prev, message]);
      }
      // Re-fetch chat partner list to bump contact cards
      fetchChatPartners();
    });

    socket.on('message_sent', (message) => {
      if (activePartner && (message.receiver._id === activePartner._id || message.sender._id === activePartner._id)) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      disconnectSocket();
    };
  }, [activePartner]);

  useEffect(() => {
    if (activePartner) {
      fetchMessagesHistory(activePartner._id);
    }
  }, [activePartner]);

  useEffect(() => {
    // Auto Scroll chats
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetching Helpers
  const fetchMyFiles = async () => {
    try {
      const res = await api.get('/files/my-uploads');
      if (res.data.success) setFiles(res.data.files);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyTests = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/tests/mentor/${user.id}`);
      if (res.data.success) setTests(res.data.tests);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudentScores = async () => {
    try {
      const res = await api.get('/tests/mentor/scores');
      if (res.data.success) setScores(res.data.submissions);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChatPartners = async () => {
    try {
      const res = await api.get('/chat/partners');
      if (res.data.success) setPartners(res.data.partners);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessagesHistory = async (partnerId) => {
    try {
      const res = await api.get(`/chat/history/${partnerId}`);
      if (res.data.success) setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  // Actions
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!fileObject || !fileTitle.trim()) return;

    setUploadLoading(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('file', fileObject);
    formData.append('title', fileTitle);
    formData.append('description', fileDesc);

    try {
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setStatusMessage({ type: 'success', text: 'Resource file uploaded and students notified!' });
        setFileTitle('');
        setFileDesc('');
        setFileObject(null);
        setShowUploadModal(false);
        fetchMyFiles();
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'File upload failed' });
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm('Delete this file resource?')) return;
    try {
      const res = await api.delete(`/files/${fileId}`);
      if (res.data.success) {
        setFiles(files.filter(f => f._id !== fileId));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Delete operation failed');
    }
  };

  // Dynamic quiz handlers
  const handleAddQuestion = () => {
    setNewQuestions([...newQuestions, { questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
  };

  const handleRemoveQuestion = (idx) => {
    if (newQuestions.length === 1) return;
    setNewQuestions(newQuestions.filter((_, qIdx) => qIdx !== idx));
  };

  const handleQuestionTextChange = (idx, text) => {
    const updated = [...newQuestions];
    updated[idx].questionText = text;
    setNewQuestions(updated);
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    const updated = [...newQuestions];
    updated[qIdx].options[optIdx] = val;
    setNewQuestions(updated);
  };

  const handleCorrectOptionChange = (qIdx, optIdx) => {
    const updated = [...newQuestions];
    updated[qIdx].correctOptionIndex = Number(optIdx);
    setNewQuestions(updated);
  };

  const handleCreateTest = async (e) => {
    e.preventDefault();
    if (!newTestTitle.trim()) return;

    try {
      const res = await api.post('/tests/create', {
        title: newTestTitle,
        description: newTestDesc,
        questions: newQuestions,
      });

      if (res.data.success) {
        setStatusMessage({ type: 'success', text: `Test "${newTestTitle}" published successfuly.` });
        setNewTestTitle('');
        setNewTestDesc('');
        setNewQuestions([{ questionText: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
        setShowTestModal(false);
        fetchMyTests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create test module');
    }
  };

  // Chat send action
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activePartner) return;

    const socket = getSocket();
    if (socket) {
      socket.emit('send_message', {
        receiverId: activePartner._id,
        content: chatInput.trim()
      });
      setChatInput('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col page-fade">
      {/* Mentor Navbar header */}
      <header className="px-4 md:px-6 py-4 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Nexora Logo" className="h-10 md:h-12 w-auto object-contain" />
          <span className="text-xs text-purple-400 font-extrabold uppercase tracking-wide px-2 py-0.5 rounded bg-purple-950/60 border border-purple-900/30">Mentor Terminal</span>
        </div>

        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-6 border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0">
          <div className="flex items-center space-x-3 text-left">
            <div>
              <p className="text-sm md:text-base font-bold text-white leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-400 font-medium">{user?.email}</p>
            </div>
            <img 
              src={user?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'mentor')}`} 
              alt="Mentor" 
              className="w-10 h-10 rounded-full object-cover border border-purple-500/30" 
            />
          </div>
          <button 
            onClick={logout} 
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-red-950/20 text-slate-350 hover:text-red-400 border border-slate-700 hover:border-red-900/40 transition-all shrink-0"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content wrapper */}
      <div className="flex-grow flex flex-col md:flex-row">
        {/* Left Sidebar control tabs */}
        <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-850 p-4 shrink-0 flex flex-row md:flex-col gap-2 md:gap-4 md:space-y-0 overflow-x-auto md:overflow-x-visible scrollbar-none">
          <button
            onClick={() => setActiveTab('files')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'files'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Files Uploaded</span>
          </button>
          
          <button
            onClick={() => setActiveTab('tests')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'tests'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Mock Tests Panel</span>
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
              activeTab === 'messages'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Direct Messages</span>
          </button>
        </aside>

        {/* Tab contents block */}
        <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
          {statusMessage && (
            <div className={`mb-6 p-4 rounded-xl border text-sm flex justify-between items-center ${
              statusMessage.type === 'success' ? 'bg-purple-900/10 border-purple-500/20 text-purple-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <span>{statusMessage.text}</span>
              <button onClick={() => setStatusMessage(null)} className="text-xs uppercase font-bold tracking-wider opacity-60 hover:opacity-100">Dismiss</button>
            </div>
          )}

          {/* FILES UPLOADED SECTION */}
          {activeTab === 'files' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 gap-4">
                <div>
                  <h2 className="text-xl font-bold">Uploaded Course Materials</h2>
                  <p className="text-slate-400 text-sm mt-1">Publish study slides, assets, and recorded videos to your subscribed students</p>
                </div>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold flex items-center gap-2 hover:scale-[1.01] transition-all shadow-md shadow-purple-900/40 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Resource</span>
                </button>
              </div>

              {files.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-900 border-dashed space-y-4">
                  <Upload className="w-12 h-12 text-slate-600 mx-auto" />
                  <p className="text-slate-400 text-sm font-medium">No documents uploaded yet. Share resources with your students.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {files.map((file) => (
                    <div key={file._id} className="p-5 rounded-2xl bg-slate-900 border border-slate-850 flex flex-col justify-between group hover:border-purple-550/30 transition-all font-sans">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                            file.fileType === 'video' ? 'bg-indigo-950 text-indigo-400' : 'bg-emerald-950 text-emerald-400'
                          }`}>
                            {file.fileType}
                          </span>
                          <button
                            onClick={() => handleDeleteFile(file._id)}
                            className="p-1.5 rounded-lg bg-slate-850 hover:bg-red-950/20 text-slate-400 hover:text-red-400 border border-slate-700/60 hover:border-red-900/40 transition-colors"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h4 className="font-bold text-slate-100 group-hover:text-purple-400 transition-colors leading-tight line-clamp-1">{file.title}</h4>
                        <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{file.description || 'No description provided.'}</p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-850 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">{new Date(file.createdAt).toLocaleDateString()}</span>
                        <a
                          href={file.fileUrl.startsWith('http') ? file.fileUrl : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${file.fileUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-purple-400 font-bold hover:underline"
                        >
                          View Resource &rarr;
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MOCK TESTS PANEL */}
          {activeTab === 'tests' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Test list & additions */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Created Mock Exams</h2>
                    <p className="text-slate-400 text-sm mt-1">Deploy multiple choice tests with automatic grading engines</p>
                  </div>
                  <button
                    onClick={() => setShowTestModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold flex items-center gap-2 hover:scale-[1.01] transition-all shadow-md shadow-purple-900/40 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Exam</span>
                  </button>
                </div>

                {tests.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-900 border-dashed space-y-4">
                    <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-slate-400 text-sm font-medium">No quiz modules drafted yet. Create mock tests to test student performance.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {tests.map((test) => (
                      <div key={test._id} className="p-5 rounded-2xl bg-slate-900 border border-slate-850 space-y-3">
                        <h4 className="font-bold text-slate-100 text-base line-clamp-1">{test.title}</h4>
                        <p className="text-slate-400 text-sm line-clamp-2 leading-relaxed">{test.description}</p>
                        <div className="flex items-center justify-between pt-3 border-t border-slate-850 text-xs text-slate-400 font-bold">
                          <span>{test.questions ? test.questions.length : 0} Questions</span>
                          <span className="text-xs text-slate-500 font-medium">{new Date(test.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Scoreboard lists */}
              <div className="space-y-6 bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-850">
                <div>
                  <h3 className="text-base font-bold text-white">Student Scoreboard</h3>
                  <p className="text-slate-400 text-sm mt-0.5">Real-time grades submitted by student subscribers</p>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {scores.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No student attempt submissions logged yet.</p>
                  ) : (
                    scores.map((score) => (
                      <div key={score._id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs md:text-sm gap-2">
                        <div className="space-y-1 overflow-hidden">
                          <p className="font-bold text-white line-clamp-1">{score.student?.name}</p>
                          <p className="text-xs text-slate-400 line-clamp-1">Exam: {score.mockTest?.title}</p>
                          <p className="text-xs text-slate-500">{new Date(score.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                            (score.score / score.totalQuestions) >= 0.5 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {score.score}/{score.totalQuestions}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* MESSAGES / CHATS SECTION */}
          {activeTab === 'messages' && (
            <div className="flex flex-col md:grid md:grid-cols-3 gap-6 h-[600px] rounded-3xl border border-slate-850 bg-slate-900 overflow-hidden">
              {/* Contacts list */}
              <div className="border-b md:border-b-0 md:border-r border-slate-850 p-4 flex flex-col space-y-4 h-[200px] md:h-auto shrink-0 md:shrink">
                <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider px-2">Conversations</h3>
                
                <div className="flex-grow overflow-y-auto space-y-2 pr-1">
                  {partners.length === 0 ? (
                    <p className="text-sm text-slate-500 px-2 py-4">No subscribers active yet.</p>
                  ) : (
                    partners.map((partner) => (
                      <button
                        key={partner._id}
                        onClick={() => { setActivePartner(partner); setMessages([]); }}
                        className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
                          activePartner?._id === partner._id ? 'bg-purple-650 text-white' : 'hover:bg-slate-800/60 text-slate-350'
                        }`}
                      >
                        <img 
                          src={partner.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(partner.email || 'student')}`} 
                          alt="Contact" 
                          className="w-10 h-10 rounded-full border border-slate-700 object-cover" 
                        />
                        <div className="text-left overflow-hidden">
                          <p className="text-sm font-bold leading-tight line-clamp-1">{partner.name}</p>
                          <p className={`text-xs mt-0.5 line-clamp-1 ${activePartner?._id === partner._id ? 'text-purple-100' : 'text-slate-450'}`}>{partner.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Chat conversations window */}
              <div className="md:col-span-2 flex flex-col justify-between bg-slate-950 h-[400px] md:h-auto overflow-hidden">
                {activePartner ? (
                  <>
                    {/* Header */}
                    <div className="p-4 bg-slate-900 border-b border-slate-855 flex items-center gap-3 shrink-0">
                      <img 
                        src={activePartner.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(activePartner.email || 'student')}`} 
                        alt="Partner" 
                        className="w-10 h-10 rounded-full border border-slate-700 object-cover" 
                      />
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{activePartner.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded text-emerald-400 bg-emerald-500/10 font-bold uppercase mt-1 inline-block">Student</span>
                      </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-grow overflow-y-auto p-4 space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg._id}
                          className={`flex ${msg.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs md:text-sm space-y-1 font-sans shadow ${
                            msg.sender._id === user.id
                              ? 'bg-purple-650 text-white rounded-tr-none'
                              : 'bg-slate-900 text-slate-205 border border-slate-850 rounded-tl-none'
                          }`}>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <span className="block text-[10px] text-right opacity-60">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Form inputs */}
                    <form onSubmit={handleSendMessage} className="p-4 bg-slate-905 border-t border-slate-850 flex items-center gap-3 shrink-0">
                      <input
                        type="text"
                        placeholder="Write a message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-grow bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="submit"
                        className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md transition-all hover:scale-[1.02]"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 text-slate-500">
                    <MessageSquare className="w-12 h-12 text-slate-800" />
                    <p className="text-sm font-semibold">Select a student from the conversation panel to start chatting.</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* FILE RESOURCE UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-6 relative space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white">Upload New Course Material</h3>
              <p className="text-slate-450 text-xs mt-1">Publish class resources, documents, or lecture videos</p>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Physics Lecture 1"
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-purple-550"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Description</label>
                <textarea
                  placeholder="Explain brief overview or topics covered..."
                  value={fileDesc}
                  onChange={(e) => setFileDesc(e.target.value)}
                  rows="3"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-purple-550 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Attachment File</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setFileObject(e.target.files[0])}
                  className="w-full text-slate-400 bg-slate-950 border border-slate-800 rounded-xl p-2.5 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-lg file:border-none file:text-[10px] file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-850 hover:bg-slate-850 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold disabled:opacity-55"
                >
                  {uploadLoading ? 'Uploading Asset...' : 'Upload File'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOCK TEST CREATION MODAL */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 relative space-y-6 my-8">
            <div>
              <h3 className="text-lg font-bold text-white">Design New Mock Quiz</h3>
              <p className="text-slate-450 text-xs mt-1">Author student MCQs and configure correct answers indices</p>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-6 text-xs">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Exam Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. JavaScript Arrays Quiz"
                    value={newTestTitle}
                    onChange={(e) => setNewTestTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-purple-550"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Brief Description</label>
                  <input
                    type="text"
                    placeholder="Short summary of target topics..."
                    value={newTestDesc}
                    onChange={(e) => setNewTestDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-purple-550"
                  />
                </div>
              </div>

              {/* Dynamic Questions listing wrapper */}
              <div className="space-y-6 max-h-[350px] overflow-y-auto pr-2">
                {newQuestions.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 rounded-2xl bg-slate-950 border border-slate-850 space-y-4 relative">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-400">Question #{qIndex + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Remove Block
                      </button>
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Write the question prompt here..."
                        value={q.questionText}
                        onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-purple-550"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-slate-400 block uppercase">Choices (Mark Radio button for Correct Choice)</label>
                      <div className="grid md:grid-cols-2 gap-2 text-xs">
                        {q.options.map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1">
                            <input
                              type="radio"
                              name={`correct-choice-${qIndex}`}
                              checked={q.correctOptionIndex === optIndex}
                              onChange={() => handleCorrectOptionChange(qIndex, optIndex)}
                              className="accent-purple-650 cursor-pointer w-4 h-4"
                            />
                            <input
                              type="text"
                              required
                              placeholder={`Option ${optIndex + 1}`}
                              value={opt}
                              onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                              className="bg-transparent text-slate-100 flex-grow py-1 px-1 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Question Button */}
              <button
                type="button"
                onClick={handleAddQuestion}
                className="w-full py-2.5 rounded-xl border border-dashed border-purple-500/30 hover:border-purple-500 bg-purple-500/5 hover:bg-purple-900/10 text-purple-400 font-bold transition-all"
              >
                + Add Another Question
              </button>

              <div className="flex gap-4 pt-4 border-t border-slate-850">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-855 hover:bg-slate-850 hover:text-white font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Publish Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MentorDashboard;
