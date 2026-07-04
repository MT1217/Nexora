import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { initiateSocketConnection, disconnectSocket, getSocket } from '../socket';
import api from '../api';
import { 
  BookOpen, FileText, Video, Bell, Search, Star, MessageSquare, Send, CheckCircle, HelpCircle, 
  User, LogOut, Award, MailOpen, Lock, X
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, logout, loadUser } = useAuth();
  
  // Workspace selection states
  const [selectedMentor, setSelectedMentor] = useState(null); // Active mentor workspace clicked
  const [workspaceTab, setWorkspaceTab] = useState('files'); // 'files' | 'tests' | 'chat'

  // Mailbox states
  const [notifications, setNotifications] = useState([]);
  const [showMailbox, setShowMailbox] = useState(false);

  // Discovery/Search States
  const [mentorsList, setMentorsList] = useState([]);
  const [searchWord, setSearchWord] = useState('');
  const [mySubscriptions, setMySubscriptions] = useState([]);

  // Active Workspace Files/Tests states
  const [mentorFiles, setMentorFiles] = useState([]);
  const [mentorTests, setMentorTests] = useState([]);
  const [mentorTestAttempts, setMentorTestAttempts] = useState([]);

  // Mock Test Taking Module
  const [activeTakingTest, setActiveTakingTest] = useState(null); // test object currently being attempted
  const [selectedAnswers, setSelectedAnswers] = useState([]); // array mapping question index -> choice
  const [testResult, setTestResult] = useState(null); // outcome payload from grading API

  // Chat parameters
  const [chatMessages, setChatMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Initial fetch utilities
    fetchMentors();
    fetchSubscriptions();
    fetchMailbox();

    // Setup real-time Socket.io listener
    const token = localStorage.getItem('token');
    const socket = initiateSocketConnection(token);

    socket.on('new_mailbox_message', () => {
      // Bumps new notifications count
      fetchMailbox();
    });

    socket.on('receive_message', (message) => {
      if (selectedMentor && (message.sender._id === selectedMentor._id || message.receiver._id === selectedMentor._id)) {
        setChatMessages((prev) => [...prev, message]);
      }
    });

    socket.on('message_sent', (message) => {
      if (selectedMentor && (message.receiver._id === selectedMentor._id || message.sender._id === selectedMentor._id)) {
        setChatMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      disconnectSocket();
    };
  }, [selectedMentor]);

  useEffect(() => {
    if (selectedMentor) {
      fetchWorkspaceContent();
    }
  }, [selectedMentor]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Fetch utilities
  const fetchMentors = async (val = '') => {
    try {
      const res = await api.get(`/mentors?search=${val}`);
      if (res.data.success) setMentorsList(res.data.mentors);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await api.get('/mentors/subscribed');
      if (res.data.success) {
        setMySubscriptions(res.data.mentors);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMailbox = async () => {
    try {
      const res = await api.get('/mentors/mailbox');
      if (res.data.success) setNotifications(res.data.notifications);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchWorkspaceContent = async () => {
    if (!selectedMentor) return;
    const mId = selectedMentor._id;

    try {
      // 1. Files
      const filesRes = await api.get(`/files/mentor/${mId}`);
      if (filesRes.data.success) setMentorFiles(filesRes.data.files);

      // 2. Tests
      const testsRes = await api.get(`/tests/mentor/${mId}`);
      if (testsRes.data.success) {
        setMentorTests(testsRes.data.tests);
        setMentorTestAttempts(testsRes.data.attempts || []);
      }

      // 3. Chat Messages logs
      const chatRes = await api.get(`/chat/history/${mId}`);
      if (chatRes.data.success) setChatMessages(chatRes.data.messages);

      // Close mock test taking window on mentor change
      setActiveTakingTest(null);
      setTestResult(null);
    } catch (err) {
      console.error('Workspace fetch error:', err);
    }
  };

  // Actions
  const handleSearchKeyPress = (e) => {
    e.preventDefault();
    fetchMentors(searchWord);
  };

  const toggleSubscription = async (mentor) => {
    const isSubscribed = mySubscriptions.some(sub => sub._id === mentor._id);
    
    try {
      if (isSubscribed) {
        if (!window.confirm(`Unsubscribe from mentor ${mentor.name}?`)) return;
        const res = await api.post(`/mentors/${mentor._id}/unsubscribe`);
        if (res.data.success) {
          // If unsubscribed from active workspace mentor, close it
          if (selectedMentor?._id === mentor._id) {
            setSelectedMentor(null);
          }
        }
      } else {
        await api.post(`/mentors/${mentor._id}/subscribe`);
      }
      
      // Sync subscription state
      await fetchSubscriptions();
      await loadUser();
      
    } catch (err) {
      alert(err.response?.data?.message || 'Error mutating subscription state');
    }
  };

  const handleMarkMailboxRead = async () => {
    try {
      const res = await api.put('/mentors/mailbox/read');
      if (res.data.success) {
        // Mark local alerts read
        setNotifications(notifications.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Exam attempt handlers
  const handleStartExam = async (test) => {
    try {
      // Pull test detail (failsafe strips answer values in API schema)
      const res = await api.get(`/tests/${test._id}`);
      if (res.data.success) {
        setActiveTakingTest(res.data.test);
        setSelectedAnswers(new Array(res.data.test.questions.length).fill(null));
        setTestResult(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Exam files retrieval failed.');
    }
  };

  const handleAnalyzeExam = async (test) => {
    try {
      const res = await api.get(`/tests/${test._id}/analysis`);
      if (res.data.success) {
        setActiveTakingTest(test);
        setTestResult(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to retrieve test analysis.');
    }
  };

  const handleSelectAnswer = (qIndex, optionIndex) => {
    const updated = [...selectedAnswers];
    updated[qIndex] = optionIndex;
    setSelectedAnswers(updated);
  };

  const handleSubmitExam = async (e) => {
    e.preventDefault();
    if (selectedAnswers.some(ans => ans === null)) {
      return alert('Must complete all question items before submitting!');
    }

    try {
      const res = await api.post(`/tests/${activeTakingTest._id}/submit`, {
        answers: selectedAnswers
      });
      if (res.data.success) {
        setTestResult(res.data);
        // Refresh workspace content to sync attempts status instantly (re-fetching attempts)
        fetchWorkspaceContent();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed processing exam grading request.');
    }
  };

  // Socket Chat sender
  const handleSendChatMessage = (e) => {
    e.preventDefault();
    if (!chatText.trim() || !selectedMentor) return;

    const socket = getSocket();
    if (socket) {
      socket.emit('send_message', {
        receiverId: selectedMentor._id,
        content: chatText.trim()
      });
      setChatText('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col page-fade">
      {/* Student Top Navbar */}
      <header className="px-4 md:px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <img src="/logo.png" alt="Nexora Logo" className="h-10 md:h-12 w-auto object-contain" />
          <span className="text-xs text-emerald-400 font-extrabold uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-900/30">Student Terminal</span>
        </div>

        <div className="flex items-center space-x-4 md:space-x-6">
          {/* Student Mailbox Trigger */}
          <div className="relative">
            <button
              onClick={() => { setShowMailbox(!showMailbox); handleMarkMailboxRead(); }}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-350 hover:text-white transition-all relative"
            >
              <Bell className="w-4 h-4" />
              {notifications.some(n => !n.read) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
              )}
            </button>

            {/* Mailbox Dropdown panel */}
            {showMailbox && (
              <div className="absolute right-0 mt-3 w-[calc(100vw-32px)] sm:w-80 md:w-96 bg-slate-900 border border-slate-850 rounded-2xl p-4 shadow-xl z-50 text-slate-200">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <span className="text-sm font-bold text-white uppercase tracking-wider">Mailbox Notifications</span>
                  <button onClick={() => setShowMailbox(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">Mailbox is completely empty.</p>
                  ) : (
                    notifications.map((note) => (
                      <div key={note._id} className={`p-2.5 rounded-xl text-xs leading-relaxed border transition-colors ${
                        note.read ? 'bg-slate-950/40 border-slate-850 text-slate-550' : 'bg-slate-950 border-emerald-900/30 text-white'
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-emerald-400 capitalize">{note.sender?.name}</span>
                          <span className="text-[10px] text-slate-500">{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p>{note.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3 text-right">
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-white leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-400 font-medium">{user?.email}</p>
            </div>
            <img 
              src={user?.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'student')}`} 
              alt="Student" 
              className="w-10 h-10 rounded-full object-cover border border-emerald-500/30" 
            />
          </div>
          
          <button 
            onClick={logout} 
            className="p-2.5 rounded-xl bg-slate-805 hover:bg-red-950/20 text-slate-350 hover:text-red-400 border border-slate-705 hover:border-red-900/40 transition-all"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Student Workspace Section */}
      <div className="flex-grow flex flex-col md:flex-row">
        {/* Left Subscriptions Sidebar List */}
        <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-850 p-4 shrink-0 flex flex-col space-y-4">
          <div className="px-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">My Subscriptions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Click to access mentor assets</p>
          </div>

          <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible md:overflow-y-auto pb-2 md:pb-0 scrollbar-thin">
            {mySubscriptions.length === 0 ? (
              <div className="p-4 text-center rounded-xl bg-slate-950/30 border border-slate-850 border-dashed text-slate-505 text-xs w-full">
                <Lock className="w-6 h-6 mx-auto mb-2 text-slate-700" />
                <span>Search and subscribe to mentors to unlock workspaces</span>
              </div>
            ) : (
              mySubscriptions.map((sub) => (
                <button
                  key={sub._id}
                  onClick={() => { setSelectedMentor(sub); setWorkspaceTab('files'); }}
                  className={`w-auto md:w-full shrink-0 p-3 rounded-xl flex items-center gap-3 transition-all ${
                    selectedMentor?._id === sub._id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                      : 'text-slate-350 hover:bg-slate-850/60'
                  }`}
                >
                  <img 
                    src={sub.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(sub.email || 'mentor')}`} 
                    alt="Mentor Thumbnail" 
                    className="w-8 h-8 rounded-full object-cover border border-slate-800" 
                  />
                  <span className="text-sm font-bold leading-tight block text-left line-clamp-1">{sub.name}</span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Center Dashboard content workspaces */}
        <div className="flex-grow p-4 md:p-6 flex flex-col lg:flex-row gap-6 md:gap-8 overflow-y-auto">
          {/* Left/Main Column: Selected Mentor Workspace / Global directory */}
          <div className="flex-grow space-y-6 lg:max-w-4.5xl">
            {selectedMentor ? (
              /* ACTIVE MENTOR WORKSPACE */
              <div className="space-y-6">
                {/* Header info */}
                <div className="p-4 md:p-6 rounded-3xl bg-slate-900 border border-slate-850 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={selectedMentor.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedMentor.email || 'mentor')}`} 
                      alt="Mentor Avatar" 
                      className="w-12 h-12 rounded-full border-2 border-emerald-500/30 object-cover" 
                    />
                    <div>
                      <h2 className="text-base md:text-lg font-bold text-white leading-tight">{selectedMentor.name}</h2>
                      <span className="text-xs text-slate-400 mt-1 block">Active Workspace • Subscribed Student</span>
                    </div>
                  </div>

                  {/* Tabs Selector inside Workspace */}
                  <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-805 text-xs font-bold w-full md:w-auto overflow-x-auto scrollbar-none">
                    <button
                      onClick={() => { setWorkspaceTab('files'); setActiveTakingTest(null); }}
                      className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
                        workspaceTab === 'files' ? 'bg-emerald-600 text-white' : 'text-slate-404 hover:text-slate-200'
                      }`}
                    >
                      Files
                    </button>
                    <button
                      onClick={() => { setWorkspaceTab('tests'); setActiveTakingTest(null); }}
                      className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
                        workspaceTab === 'tests' ? 'bg-emerald-600 text-white' : 'text-slate-404 hover:text-slate-200'
                      }`}
                    >
                      Mock Tests
                    </button>
                    <button
                      onClick={() => { setWorkspaceTab('chat'); setActiveTakingTest(null); }}
                      className={`flex-1 md:flex-initial px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap ${
                        workspaceTab === 'chat' ? 'bg-emerald-600 text-white' : 'text-slate-404 hover:text-slate-200'
                      }`}
                    >
                      Chat Room
                    </button>
                  </div>
                </div>

                {/* Workspace tab views */}
                {workspaceTab === 'files' && (
                  <div className="space-y-4">
                    <h3 className="text-base md:text-lg font-bold">Available Media Materials</h3>
                    
                    {mentorFiles.length === 0 ? (
                      <p className="text-slate-500 text-sm py-8">Mentor hasn't uploaded any documents or recorded videos yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {mentorFiles.map((file) => (
                          <div key={file._id} className="p-4 rounded-2xl bg-slate-900 border border-slate-850 hover:border-slate-800 transition-colors flex items-center justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="p-2.5 bg-slate-950 text-slate-405 rounded-xl relative top-0.5 shrink-0">
                                {file.fileType === 'video' ? <Video className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                              </div>
                              <div className="space-y-1 min-w-0">
                                <h4 className="font-bold text-sm text-white leading-snug line-clamp-1">{file.title}</h4>
                                <p className="text-xs text-slate-400 leading-normal line-clamp-1">{file.description || 'No description.'}</p>
                              </div>
                            </div>
                            <a
                              href={file.fileUrl.startsWith('http') ? file.fileUrl : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'}${file.fileUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3.5 py-2 rounded-lg border border-slate-800 hover:bg-slate-800 text-xs font-bold text-emerald-400 tracking-wider whitespace-nowrap shrink-0"
                            >
                              OPEN FILE
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}                {workspaceTab === 'tests' && (
                  <div className="space-y-4">
                    {!activeTakingTest ? (
                      <>
                        <h3 className="text-base md:text-lg font-bold">Assigned Mock Exams</h3>
                        {mentorTests.length === 0 ? (
                          <p className="text-slate-500 text-sm py-8">No tests generated by the mentor yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {mentorTests.map((test) => {
                              const hasAttempted = mentorTestAttempts.some(att => att.mockTest === test._id || att.mockTest?._id === test._id);
                              
                              return (
                                <div key={test._id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between h-48">
                                  <div className="space-y-2">
                                    <h4 className="font-bold text-white text-base line-clamp-1">{test.title}</h4>
                                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">{test.description}</p>
                                  </div>
                                  <div className="flex items-center justify-between border-t border-slate-850 pt-3 mt-3">
                                    <span className="text-xs font-semibold text-slate-500">MCQ Exam • {test.questions?.length} Qs</span>
                                    {hasAttempted ? (
                                      <button
                                        onClick={() => handleAnalyzeExam(test)}
                                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-lg text-xs font-bold hover:scale-[1.01] transition-all shadow"
                                      >
                                        ANALYZE TEST
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleStartExam(test)}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold hover:scale-[1.01] transition-all shadow shadow-emerald-950"
                                      >
                                        TAKE QUIZ
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    ) : (
                      /* ACTIVE EXAM RUNNER MODULE */
                      <div className="p-4 md:p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3 gap-2">
                          <div>
                            <h3 className="text-base md:text-lg font-extrabold text-white">{activeTakingTest.title}</h3>
                            <p className="text-xs text-slate-400">{activeTakingTest.description}</p>
                          </div>
                          <button
                            onClick={() => { setActiveTakingTest(null); setTestResult(null); }}
                            className="p-2 px-3 rounded-lg border border-slate-800 hover:bg-slate-850 text-xs text-slate-400 font-bold shrink-0"
                          >
                            Exit Exam
                          </button>
                        </div>

                        {!testResult ? (
                          /* TAKING */
                          <form onSubmit={handleSubmitExam} className="space-y-6 text-sm">
                            <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
                              {activeTakingTest.questions.map((q, qIndex) => (
                                <div key={q._id || qIndex} className="space-y-3 border-b border-slate-850 pb-4 last:border-none">
                                  <p className="font-bold text-white text-sm">{qIndex + 1}. {q.questionText}</p>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs md:text-sm">
                                    {q.options.map((opt, optIndex) => (
                                      <button
                                        type="button"
                                        key={optIndex}
                                        onClick={() => handleSelectAnswer(qIndex, optIndex)}
                                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                                          selectedAnswers[qIndex] === optIndex
                                            ? 'border-emerald-500 bg-emerald-500/10 text-white font-bold'
                                            : 'border-slate-800 bg-slate-950 text-slate-450 hover:border-slate-700'
                                        }`}
                                      >
                                        <span>{opt}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              type="submit"
                              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm tracking-wider"
                            >
                              SUBMIT ANSWERS FOR GRADING
                            </button>
                          </form>
                        ) : (
                          /* GRADINGS OUTCOME VIEW */
                          <div className="space-y-6">
                            <div className="text-center p-6 bg-slate-950 rounded-2xl border border-slate-850 space-y-2">
                              <Award className="w-12 h-12 text-emerald-400 mx-auto" />
                              <h4 className="font-bold text-sm text-slate-350">Exam Grading Report</h4>
                              <p className="text-2xl font-extrabold text-white">{testResult.score} / {testResult.totalQuestions} Correct</p>
                              <p className="text-slate-400 text-xs md:text-sm">Percentage Result Score: {testResult.percentage}%</p>
                            </div>

                            {/* Detailed Results review */}
                            <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                              {testResult.results.map((res, index) => (
                                <div key={index} className="p-3 bg-slate-955 rounded-xl border border-slate-850 text-xs md:text-sm space-y-2">
                                  <p className="font-semibold text-white">{index + 1}. {res.questionText}</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                    <div className="p-2.5 rounded bg-red-500/10 text-red-400 leading-tight">
                                      Your Choice: {res.options[res.studentAnswer] || '(None)'}
                                    </div>
                                    <div className="p-2.5 rounded bg-student-500/10 text-emerald-400 leading-tight">
                                      Correct Answer: {res.options[res.correctAnswer]}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            <button
                              onClick={() => { setActiveTakingTest(null); setTestResult(null); }}
                              className="w-full py-3.5 rounded-xl bg-slate-800 text-white hover:bg-slate-750 font-bold text-sm"
                            >
                              Complete Review
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {workspaceTab === 'chat' && (
                  /* SOCKET ONE ON ONE MESSENGER CHAT */
                  <div className="rounded-3xl border border-slate-850 bg-slate-900 overflow-hidden flex flex-col h-[400px]">
                    {/* Messaging frame */}
                    <div className="flex-grow p-4 overflow-y-auto space-y-4">
                      {chatMessages.length === 0 ? (
                        <p className="text-center text-slate-500 py-12 text-sm">Start a conversation with your mentor.</p>
                      ) : (
                        chatMessages.map((msg) => (
                          <div
                            key={msg._id}
                            className={`flex ${msg.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs md:text-sm space-y-1 font-sans shadow ${
                              msg.sender._id === user.id
                                ? 'bg-emerald-600 text-white rounded-tr-none'
                                : 'bg-slate-950 text-slate-205 border border-slate-850 rounded-tl-none'
                            }`}>
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              <span className="block text-[10px] text-right opacity-60">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Form panel inputs */}
                    <form onSubmit={handleSendChatMessage} className="p-4 bg-slate-950 border-t border-slate-850 flex items-center gap-3">
                      <input
                        type="text"
                        placeholder="Write a message..."
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        className="flex-grow bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-600"
                      />
                      <button
                        type="submit"
                        className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all hover:scale-[1.02]"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ) : (
              /* DEFAULT ZERO-STATE - INSTRUCT TO SELECT WORKSPACE OR DISCOVER */
              <div className="p-8 text-center rounded-3xl bg-slate-900/50 border border-slate-900 space-y-6">
                <BookOpen className="w-12 h-12 text-emerald-555 mx-auto" />
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white">Select Subscribed Mentor Workspace</h3>
                  <p className="text-slate-400 text-sm mt-1.5 max-w-sm mx-auto leading-relaxed">
                    Choose one of your subscribed mentors in the sidebar to open their file repositories, take mock exams, and message them directly.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Search Mentors Discovery directory */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            <div className="bg-slate-900 p-5 md:p-6 rounded-3xl border border-slate-850 space-y-4">
              <div>
                <h3 className="text-sm md:text-base font-bold text-white">Discover Mentors</h3>
                <p className="text-slate-400 text-xs mt-0.5">Lookup, subscribe, and enroll under new mentors</p>
              </div>

              {/* Discovery Form */}
              <form onSubmit={handleSearchKeyPress} className="flex gap-2">
                <div className="relative flex-grow">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                    <Search className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchWord}
                    onChange={(e) => setSearchWord(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-650 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold"
                >
                  Go
                </button>
              </form>

              {/* Mentors Results lists */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {mentorsList.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No registered mentors found.</p>
                ) : (
                  mentorsList.map((mentor) => {
                    const isSubscribed = mySubscriptions.some(sub => sub._id === mentor._id);
                    return (
                      <div key={mentor._id} className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex items-center justify-between text-xs md:text-sm gap-3">
                        <div className="space-y-1 overflow-hidden">
                          <p className="font-bold text-white line-clamp-1">{mentor.name}</p>
                          <p className="text-xs text-slate-400 line-clamp-1">{mentor.email}</p>
                        </div>
                        <button
                          onClick={() => toggleSubscription(mentor)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                            isSubscribed
                              ? 'bg-slate-805 text-slate-405 hover:bg-red-500/10 hover:text-red-400 hover:border hover:border-red-900/10'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {isSubscribed ? 'Subscribed' : 'Subscribe'}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
